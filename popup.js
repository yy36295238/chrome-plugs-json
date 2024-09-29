document.addEventListener('DOMContentLoaded', function() {
  const paneCountSelect = document.getElementById('paneCount');
  const jsonInputs = document.getElementById('jsonInputs');
  const compareButton = document.getElementById('compare');
  const formatButton = document.getElementById('format');
  const resultDiv = document.getElementById('result');

  function createJsonInputs(count) {
    jsonInputs.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const textarea = document.createElement('textarea');
      textarea.placeholder = `JSON ${i + 1}`;
      jsonInputs.appendChild(textarea);
    }
  }

  paneCountSelect.addEventListener('change', function() {
    createJsonInputs(parseInt(this.value));
  });

  compareButton.addEventListener('click', function() {
    // 实现JSON比较逻辑
  });

  formatButton.addEventListener('click', function() {
    // 实现JSON格式化逻辑
  });

  // 初始化
  createJsonInputs(2);

  document.getElementById('openCompare').addEventListener('click', function() {
    chrome.windows.create({
      url: chrome.runtime.getURL('compare.html'),
      type: 'popup',
      width: 800,
      height: 600
    });
  });
});