document.addEventListener('DOMContentLoaded', function() {
  const paneCountRadios = document.getElementsByName('paneCount');
  const jsonInputs = document.getElementById('jsonInputs');
  const clearAllButton = document.getElementById('clearAll');

  function createJsonInputs(count) {
    const currentPanes = jsonInputs.querySelectorAll('.json-pane');
    const currentCount = currentPanes.length;

    // 计算新的宽度
    const paneWidth = `calc(${100 / count}% - ${5 * (count - 1) / count}px)`;

    // 如果新的数量大于当前数量，添加新的分隔栏
    if (count > currentCount) {
      for (let i = currentCount; i < count; i++) {
        const pane = document.createElement('div');
        pane.className = 'json-pane';
        pane.style.width = paneWidth;
        
        const editor = document.createElement('pre');
        editor.className = 'json-editor';
        editor.contentEditable = true;
        editor.spellcheck = false;
        editor.setAttribute('placeholder', `JSON ${i + 1}`);
        
        editor.addEventListener('input', function() {
          saveData();
        });
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';
        
        const formatButton = document.createElement('button');
        formatButton.textContent = '格式化';
        formatButton.className = 'format-button';
        formatButton.addEventListener('click', function() {
          formatJsonEditor(editor);
        });
        
        const generateDemoButton = document.createElement('button');
        generateDemoButton.textContent = '演示数据';
        generateDemoButton.className = 'generate-demo-button';
        generateDemoButton.addEventListener('click', function() {
          generateDemoData(editor);
        });
        
        const expandAllButton = document.createElement('button');
        expandAllButton.textContent = '展开';
        expandAllButton.className = 'expand-all-button';
        expandAllButton.addEventListener('click', function() {
          expandAllJson(editor);
        });
        
        // 添加复制按钮
        const copyButton = document.createElement('button');
        copyButton.textContent = '复制';
        copyButton.className = 'copy-button';
        copyButton.addEventListener('click', function() {
          copyJsonContent(editor);
        });
        
        // 添加清除按钮
        const clearButton = document.createElement('button');
        clearButton.textContent = '清除';
        clearButton.className = 'clear-button';
        clearButton.addEventListener('click', function() {
          clearJsonEditor(editor);
        });
        
        buttonContainer.appendChild(formatButton);
        buttonContainer.appendChild(generateDemoButton);
        buttonContainer.appendChild(expandAllButton);
        buttonContainer.appendChild(copyButton);
        buttonContainer.appendChild(clearButton); // 添加清除按钮到容器
        
        pane.appendChild(buttonContainer);
        pane.appendChild(editor);
        jsonInputs.appendChild(pane);

        // 添加可拖动的分隔条，除了最后一pane
        if (i < count - 1) {
          const resizer = document.createElement('div');
          resizer.className = 'resizer';
          jsonInputs.appendChild(resizer);
          resizer.addEventListener('mousedown', initResize);
        }
      }
    } 
    // 如果的数量小于当前数量，移除多余的分隔
    else if (count < currentCount) {
      for (let i = currentCount - 1; i >= count; i--) {
        jsonInputs.removeChild(jsonInputs.lastChild); // 移除最后一个分隔栏
        if (i > count) {
          jsonInputs.removeChild(jsonInputs.lastChild); // 移除分隔条
        }
      }
    }

    // 调整所有分隔栏的宽度
    const allPanes = jsonInputs.querySelectorAll('.json-pane');
    allPanes.forEach(pane => {
      pane.style.width = paneWidth;
    });

    // 保存新的分隔栏数量
    chrome.storage.local.set({paneCount: count});
  }

  function initResize(e) {
    const resizer = e.target;
    const prevPane = resizer.previousElementSibling;
    const nextPane = resizer.nextElementSibling;
    
    const startX = e.clientX;
    const prevStartWidth = prevPane.getBoundingClientRect().width;
    const nextStartWidth = nextPane.getBoundingClientRect().width;

    function resize(e) {
      const dx = e.clientX - startX;
      prevPane.style.width = `${prevStartWidth + dx}px`;
      nextPane.style.width = `${nextStartWidth - dx}px`;
    }

    function stopResize() {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResize);
    }

    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResize);
  }

  function formatJSON(obj) {
    return JSON.stringify(obj, null, 2);
  }

  function formatJsonEditor(editor) {
    try {
      const content = JSON.parse(editor.textContent);
      const formattedHtml = formatJsonWithCollapsible(content);
      editor.innerHTML = formattedHtml;
      addCollapsibleListeners(editor);
      saveData();
    } catch (e) {
      console.error('Invalid JSON:', e);
      alert('无效的 JSON 格式');
    }
  }

  function formatJsonWithCollapsible(obj, indent = 0) {
    if (typeof obj !== 'object' || obj === null) {
      return formatPrimitive(obj);
    }

    const isArray = Array.isArray(obj);
    const openBracket = isArray ? '[' : '{';
    const closeBracket = isArray ? ']' : '}';
    const indentStr = ' '.repeat(indent * 2);
    const nextIndentStr = ' '.repeat((indent + 1) * 2);

    if (Object.keys(obj).length === 0) {
      return openBracket + closeBracket;
    }

    let result = `<span class="collapsible">${openBracket}</span><div class="collapsible-content">`;

    const entries = Object.entries(obj);
    entries.forEach(([key, value], index) => {
      const formattedValue = formatJsonWithCollapsible(value, indent + 1);
      const comma = index < entries.length - 1 ? ',' : '';
      if (isArray) {
        result += `${nextIndentStr}${formattedValue}${comma}`;
      } else {
        result += `${nextIndentStr}<span class="json-key">"${key}"</span>: ${formattedValue}${comma}`;
      }
      if (index < entries.length - 1) {
        result += '\n';
      }
    });

    result += `</div>${indentStr}${closeBracket}`;
    return result;
  }

  function formatPrimitive(value) {
    if (typeof value === 'string') {
      return `<span class="json-string">"${value}"</span>`;
    } else if (typeof value === 'number') {
      return `<span class="json-number">${value}</span>`;
    } else if (typeof value === 'boolean') {
      return `<span class="json-boolean">${value}</span>`;
    } else if (value === null) {
      return `<span class="json-null">null</span>`;
    }
    return `<span class="json-value">${JSON.stringify(value)}</span>`;
  }

  function addCollapsibleListeners(editor) {
    const collapsibles = editor.querySelectorAll('.collapsible');
    collapsibles.forEach(collapsible => {
      collapsible.addEventListener('click', toggleCollapse);
    });
  }

  function toggleCollapse(event) {
    event.stopPropagation();
    const collapsible = event.target;
    collapsible.classList.toggle('collapsed');
    const content = collapsible.nextElementSibling;
    if (content && content.classList.contains('collapsible-content')) {
      content.classList.toggle('collapsed');
      
      if (content.classList.contains('collapsed')) {
        content.style.display = 'none';
      } else {
        content.style.display = 'block';
      }
    }
  }

  function generateDemoData(editor) {
    const demoData = {
      "name": getRandomName(),
      "age": getRandomAge(18, 80),
      "city": getRandomCity(),
      "hobbies": getRandomHobbies()
    };

    const formattedHtml = formatJsonWithCollapsible(demoData);
    editor.innerHTML = formattedHtml;
    addCollapsibleListeners(editor);
    saveData();
  }

  function getRandomName() {
    const surnames = ["张", "李", "王", "赵", "陈", "刘", "杨", "黄", "周", "吴"];
    const names = ["伟", "芳", "娜", "秀英", "敏", "静", "丽", "强", "磊", "军"];
    return surnames[Math.floor(Math.random() * surnames.length)] + names[Math.floor(Math.random() * names.length)];
  }

  function getRandomAge(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getRandomCity() {
    const cities = ["北京", "上海", "广州", "深圳", "杭州", "南京", "成都", "重庆", "武汉", "西安"];
    return cities[Math.floor(Math.random() * cities.length)];
  }

  function getRandomHobbies() {
    const hobbies = ["阅读", "游泳", "跑步", "旅行", "摄影", "烹饪", "绘画", "音乐", "电影", "瑜伽"];
    const count = Math.floor(Math.random() * 3) + 1; // 随机选择1-3爱好
    const selectedHobbies = [];
    while (selectedHobbies.length < count) {
      const hobby = hobbies[Math.floor(Math.random() * hobbies.length)];
      if (!selectedHobbies.includes(hobby)) {
        selectedHobbies.push(hobby);
      }
    }
    return selectedHobbies;
  }

  function saveData() {
    const editors = jsonInputs.querySelectorAll('.json-editor');
    const data = Array.from(editors).map(editor => editor.textContent);
    chrome.storage.local.set({
      jsonData: data
      // 移除 lastJsonData 的保存
    });
  }

  function loadData() {
    chrome.storage.local.get(['paneCount', 'jsonData'], function(result) {
      const count = result.paneCount || 2;
      const data = result.jsonData || [];

      const radio = document.querySelector(`input[name="paneCount"][value="${count}"]`);
      if (radio) radio.checked = true;

      createJsonInputs(count);

      const editors = jsonInputs.querySelectorAll('.json-editor');
      editors.forEach((editor, index) => {
        if (data[index]) {
          try {
            const content = JSON.parse(data[index]);
            const formattedHtml = formatJsonWithCollapsible(content);
            editor.innerHTML = formattedHtml;
            addCollapsibleListeners(editor);
          } catch (e) {
            editor.textContent = data[index];
          }
        }
      });
    });
  }

  function clearAllData() {
    const editors = jsonInputs.querySelectorAll('.json-editor');
    editors.forEach(editor => {
      editor.textContent = '';
      editor.removeAttribute('data-highlighted');
    });
    saveData();
  }

  function applyHighlight(element) {
    // 移除这个函数，因为我们现在使用自定义的格式化和高亮
  }

  paneCountRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.checked) {
        createJsonInputs(parseInt(this.value));
      }
    });
  });

  clearAllButton.addEventListener('click', clearAllData);

  // 初始化：加载保存的数据
  loadData();
});

// 添加新的函数用于展所有 JSON
function expandAllJson(editor) {
  const collapsibles = editor.querySelectorAll('.collapsible');
  collapsibles.forEach(collapsible => {
    collapsible.classList.remove('collapsed');
    const content = collapsible.nextElementSibling;
    if (content && content.classList.contains('collapsible-content')) {
      content.classList.remove('collapsed');
      content.style.display = 'block';
    }
  });
}

// 添加复制功能
function copyJsonContent(editor) {
  const content = editor.textContent;
  navigator.clipboard.writeText(content).then(() => {
    alert('JSON 内容已复制到剪贴板');
  }).catch(err => {
    console.error('复制失败:', err);
    alert('复制失败，请手动复制');
  });
}

// 在文件末尾添加新的清除函数
function clearJsonEditor(editor) {
  editor.textContent = '';
  editor.innerHTML = ''; // 清除所有格式化的内容
  saveData(); // 保存更改
}