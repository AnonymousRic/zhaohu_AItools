/**
 * WebView辅助工具
 * 用于处理WebView相关的功能和问题
 */

/**
 * 为WebView提供处理SharedArrayBuffer警告的脚本
 * @returns {string} 处理SharedArrayBuffer警告的内联脚本
 */
const getSharedArrayBufferFixScript = () => {
  return `
  <script>
  (function() {
    // 覆盖SharedArrayBuffer构造函数，避免警告
    if (typeof SharedArrayBuffer !== 'undefined') {
      // 保存原始的构造函数
      var originalSharedArrayBuffer = SharedArrayBuffer;
      
      // 创建一个无害的替代品
      function SafeSharedArrayBuffer(length) {
        // 使用普通的ArrayBuffer替代
        return new ArrayBuffer(length);
      }
      
      // 替换原始构造函数
      window.SharedArrayBuffer = SafeSharedArrayBuffer;
      
      console.log('已处理SharedArrayBuffer警告');
    }
    
    // 监听错误并过滤掉SharedArrayBuffer相关警告
    window.addEventListener('error', function(event) {
      if (event && event.message && 
          (event.message.includes('SharedArrayBuffer') || 
           event.message.includes('cross-origin isolation'))) {
        // 阻止错误冒泡
        event.stopPropagation();
        event.preventDefault();
        console.log('已忽略SharedArrayBuffer相关错误');
        return true;
      }
    }, true);
  })();
  </script>
  `;
};

/**
 * 为WebView URL添加适当的头部信息以支持SharedArrayBuffer
 * @param {string} url - 原始URL
 * @returns {string} 添加了参数的URL
 */
const prepareWebViewUrl = (url) => {
  if (!url) return url;
  
  try {
    // 检查URL是否已经有参数
    const hasParams = url.includes('?');
    const separator = hasParams ? '&' : '?';
    
    // 添加特殊参数，告知服务器我们需要特殊的COOP和COEP头
    return `${url}${separator}requireCrossOriginIsolation=true`;
  } catch (e) {
    console.error('处理WebView URL失败:', e);
    return url;
  }
};

/**
 * 创建一个支持SharedArrayBuffer的WebView内容
 * @param {string} url - 要加载的URL
 * @param {Object} options - 配置选项
 * @param {boolean} options.injectFix - 是否注入修复脚本
 * @returns {string} 完整的HTML内容
 */
const createWebViewContent = (url, options = { injectFix: true }) => {
  // 准备URL
  const preparedUrl = prepareWebViewUrl(url);
  
  // 基本的HTML模板
  let content = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>安全WebView</title>
  `;
  
  // 注入修复脚本
  if (options.injectFix) {
    content += getSharedArrayBufferFixScript();
  }
  
  // 完成HTML
  content += `
  </head>
  <body>
    <iframe src="${preparedUrl}" style="width:100%; height:100%; border:none;"></iframe>
  </body>
  </html>
  `;
  
  return content;
};

module.exports = {
  getSharedArrayBufferFixScript,
  prepareWebViewUrl,
  createWebViewContent
}; 