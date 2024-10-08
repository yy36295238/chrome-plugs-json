// 移除这个全局变量
// let lineNumber = 1;

// 新增函数：递归地对对象的键进行排序
function sortObjectKeys(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }

  return Object.keys(obj).sort().reduce((result, key) => {
    result[key] = sortObjectKeys(obj[key]);
    return result;
  }, {});
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
    let formattedValue;
    let highlightClass = '';

    if (value && typeof value === 'object' && '__highlight' in value) {
      highlightClass = value.__highlight;
      formattedValue = formatJsonWithCollapsible(value.__value, indent + 1);
    } else {
      formattedValue = formatJsonWithCollapsible(value, indent + 1);
    }

    const comma = index < entries.length - 1 ? ',' : '';
    if (isArray) {
      result += `${nextIndentStr}<span class="${highlightClass}">${formattedValue}</span>${comma}`;
    } else {
      result += `${nextIndentStr}<span class="json-key">"${key}"</span>: <span class="${highlightClass}">${formattedValue}</span>${comma}`;
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

function createJsonInputs(count) {
  const currentPanes = jsonInputs.querySelectorAll('.json-pane');
  const currentCount = currentPanes.length;

  // 保存现有的数据
  const existingData = Array.from(currentPanes).map(pane => {
    const editor = pane.querySelector('.json-editor');
    return editor ? editor.innerHTML : '';
  });

  // 计算新的宽度
  const paneWidth = `calc(${100 / count}% - ${5 * (count - 1) / count}px)`;

  // 清空现有的分栏
  jsonInputs.innerHTML = '';

  // 创建新的分隔栏
  for (let i = 0; i < count; i++) {
    const pane = document.createElement('div');
    pane.className = 'json-pane';
    pane.style.width = paneWidth;
    
    const editor = document.createElement('pre');
    editor.className = 'json-editor';
    editor.contentEditable = 'true';  // 确保使用字符串 'true'
    editor.spellcheck = false;
    editor.setAttribute('placeholder', `JSON ${i + 1}`);
    
    // 恢复数据或使用空字符串
    editor.innerHTML = i < existingData.length ? existingData[i] : '';
    
    editor.addEventListener('input', function() {
      // 可以在这里添加其他需要的操作
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
    expandAllButton.textContent = '展';
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

    // 添可拖动的分隔条除了最后一个pane
    if (i < count - 1) {
      const resizer = document.createElement('div');
      resizer.className = 'resizer';
      jsonInputs.appendChild(resizer);
      resizer.addEventListener('mousedown', initResize);
    }
  }

  // 调整所有分隔栏的宽度
  const allPanes = jsonInputs.querySelectorAll('.json-pane');
  allPanes.forEach(pane => {
    pane.style.width = paneWidth;
  });

  // 确保所有编辑器都是可编辑的
  document.querySelectorAll('.json-editor').forEach(editor => {
    editor.contentEditable = 'true';
  });
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
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'string') {
      // 尝试解析符串值为 JSON
      try {
        JSON.parse(value);
        // 如果成功解析，返回原始字符串，保留转义字符
        return value;
      } catch (e) {
        // 如果解析失败，说明不是 JSON 字符串，正常处理
      }
    }
    return value;
  }, 2);
}

function formatJsonEditor(editor) {
  try {
    const content = editor.textContent;
    const parsedContent = JSON.parse(content);
    const formattedJson = formatJSON(parsedContent);
    const highlightedJson = highlightJson(formattedJson);
    editor.innerHTML = highlightedJson;
    // 添加可折叠功能的监听器
    addCollapsibleListeners(editor);
    // 移除 saveData() 调用
    // saveData();
  } catch (e) {
    console.error('Invalid JSON:', e);
    alert('无效的 JSON 格式');
  }
}

function highlightJson(json) {
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    let cls = 'json-number';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'json-key';
      } else {
        cls = 'json-string';
      }
    } else if (/true|false/.test(match)) {
      cls = 'json-boolean';
    } else if (/null/.test(match)) {
      cls = 'json-null';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
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

  const formattedJson = formatJSON(demoData);
  const highlightedJson = highlightJson(formattedJson);
  editor.innerHTML = highlightedJson;
  // 移除 saveData() 调用
  // saveData();
}

function getRandomName() {
  const surnames = ["张", "李", "", "赵", "陈", "刘", "杨", "黄", "周", "吴"];
  const names = ["伟", "芳", "娜", "秀英", "敏", "静", "丽", "强", "磊", "军"];
  return surnames[Math.floor(Math.random() * surnames.length)] + names[Math.floor(Math.random() * names.length)];
}

function getRandomAge(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomCity() {
  const cities = ["北京", "上海", "广州", "深圳", "杭州", "南", "成都", "重庆", "武汉", "安"];
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

// 删除或注释掉这个函数
/*
function saveData() {
  const editors = jsonInputs.querySelectorAll('.json-editor');
  const data = Array.from(editors).map(editor => editor.textContent);
  chrome.storage.local.set({
    jsonData: data
  });
}
*/

function clearAllData() {
  const editors = jsonInputs.querySelectorAll('.json-editor');
  editors.forEach(editor => {
    editor.textContent = '';
    editor.removeAttribute('data-highlighted');
  });
  // 移除 saveData() 调用（如果有的话）
}

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

function copyJsonContent(editor) {
  const content = editor.textContent;
  navigator.clipboard.writeText(content).then(() => {
    alert('JSON 内容已复制到剪贴板');
  }).catch(err => {
    console.error('复制失败:', err);
    alert('复制失败，请手动复制');
  });
}

function clearJsonEditor(editor) {
  editor.textContent = '';
  editor.innerHTML = ''; // 清所格式化的内
  saveData(); // 保存更改
}

function compareJsonData() {
  const editors = document.querySelectorAll('.json-editor');
  const jsonObjects = [];

  // 解析所有非空JSON编辑器的内容
  editors.forEach((editor, index) => {
    const content = editor.textContent.trim();
    if (content) {
      try {
        const jsonContent = JSON.parse(content);
        const sortedJsonContent = sortObjectKeys(jsonContent);
        jsonObjects.push({ index, content: sortedJsonContent });
      } catch (e) {
        alert(`JSON ${index + 1} 格式无效`);
        return;
      }
    }
  });

  if (jsonObjects.length < 2) {
    alert('至少需要两个非空的有效JSON数据进行比较');
    return;
  }

  // 获取第一个非空JSON作为基准
  const baseObject = jsonObjects[0];
  const comparisons = [];

  // 与其他所有非空JSON进行比较
  for (let i = 1; i < jsonObjects.length; i++) {
    const comparison = compareObjects(baseObject.content, jsonObjects[i].content, '', jsonObjects[i].index);
    comparisons.push({ index: jsonObjects[i].index, differences: comparison });
  }

  displayMultipleComparisonResults(baseObject, comparisons, editors);

  // 平滑滚动到最左侧
  const jsonInputsContainer = document.getElementById('jsonInputs');
  jsonInputsContainer.scrollTo({
    left: 0,
    behavior: 'smooth'
  });
}

function displayMultipleComparisonResults(baseObject, comparisons, editors) {
  const baseContent = sortObjectKeys(JSON.parse(editors[baseObject.index].textContent));
  const allDifferences = comparisons.flatMap(c => c.differences);
  const highlightedBase = highlightDifferences(baseContent, allDifferences, 'base');
  editors[baseObject.index].innerHTML = formatJSONWithHighlight(highlightedBase);

  comparisons.forEach(comparison => {
    const content = sortObjectKeys(JSON.parse(editors[comparison.index].textContent));
    const highlightedContent = highlightDifferences(content, comparison.differences, 'compare');
    editors[comparison.index].innerHTML = formatJSONWithHighlight(highlightedContent);
  });

  editors.forEach(editor => addCollapsibleListeners(editor));
}

function highlightDifferences(obj, differences, type) {
  const result = JSON.parse(JSON.stringify(obj)); // 创建深拷贝

  // 创建一个Set来跟踪所有的差异路径
  const diffPaths = new Set(differences.map(diff => diff.path));

  function highlightObject(current, path = '') {
    if (Array.isArray(current)) {
      return current.map((item, index) => {
        const newPath = `${path}[${index}]`;
        if (diffPaths.has(newPath)) {
          const diff = differences.find(d => d.path === newPath);
          return {
            value: highlightObject(item, newPath),
            highlight: diff.type === 'missing' || diff.type === 'extra' ? 'highlight-red' : 'highlight-yellow'
          };
        }
        return highlightObject(item, newPath);
      });
    }
    if (typeof current !== 'object' || current === null) {
      return current;
    }

    const highlightedObj = {};
    for (const [key, value] of Object.entries(current)) {
      const currentPath = path ? `${path}.${key}` : key;
      if (diffPaths.has(currentPath)) {
        const diff = differences.find(d => d.path === currentPath);
        let highlightClass = diff.type === 'missing' || diff.type === 'extra' ? 'highlight-red' : 'highlight-yellow';
        highlightedObj[key] = {
          value: highlightObject(value, currentPath),
          highlight: highlightClass
        };
      } else {
        highlightedObj[key] = highlightObject(value, currentPath);
      }
    }
    return highlightedObj;
  }

  return highlightObject(result);
}

function compareObjects(obj1, obj2, path = '', index) {
  const differences = [];

  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    // 处理数组
    const maxLength = Math.max(obj1.length, obj2.length);
    for (let i = 0; i < maxLength; i++) {
      const newPath = `${path}[${i}]`;
      if (i >= obj1.length) {
        differences.push({path: newPath, type: 'missing', value: obj2[i], index});
      } else if (i >= obj2.length) {
        differences.push({path: newPath, type: 'extra', value: obj1[i], index});
      } else {
        const elementDiffs = compareObjects(obj1[i], obj2[i], newPath, index);
        if (elementDiffs.length > 0) {
          differences.push(...elementDiffs);
        }
      }
    }
  } else if (typeof obj1 === 'object' && obj1 !== null && typeof obj2 === 'object' && obj2 !== null) {
    // 处理对象
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
    for (const key of allKeys) {
      const newPath = path ? `${path}.${key}` : key;
      if (!(key in obj1)) {
        differences.push({path: newPath, type: 'missing', value: obj2[key], index});
      } else if (!(key in obj2)) {
        differences.push({path: newPath, type: 'extra', value: obj1[key], index});
      } else {
        const propertyDiffs = compareObjects(obj1[key], obj2[key], newPath, index);
        if (propertyDiffs.length > 0) {
          differences.push(...propertyDiffs);
        }
      }
    }
  } else if (obj1 !== obj2) {
    // 处理原始类型
    differences.push({path, type: 'value_mismatch', value1: obj1, value2: obj2, index});
  }

  return differences;
}

function formatJSONWithHighlight(obj, indent = 0) {
  if (typeof obj !== 'object' || obj === null) {
    return highlightJson(JSON.stringify(obj));
  }

  const isArray = Array.isArray(obj);
  const openBracket = isArray ? '[' : '{';
  const closeBracket = isArray ? ']' : '}';
  const indentStr = ' '.repeat(indent * 2);
  const nextIndentStr = ' '.repeat((indent + 1) * 2);

  let result = `${indentStr}${openBracket}\n`;

  const entries = Object.entries(obj);
  entries.forEach(([key, value], index) => {
    const isLast = index === entries.length - 1;
    const highlightClass = value && value.highlight ? value.highlight : '';
    const actualValue = value && value.hasOwnProperty('value') ? value.value : value;

    let line = nextIndentStr;
    if (!isArray) {
      line += `<span class="json-key">"${key}"</span>: `;
    }

    if (typeof actualValue === 'object' && actualValue !== null) {
      const nestedJson = formatJSONWithHighlight(actualValue, indent + 1);
      result += `<span class="${highlightClass}">${line}${nestedJson.trim()}</span>`;
    } else {
      const formattedValue = highlightJson(JSON.stringify(actualValue));
      result += `<span class="${highlightClass}">${line}${formattedValue}</span>`;
    }

    if (!isLast) {
      result += ',';
    }
    result += '\n';
  });

  result += `${indentStr}${closeBracket}`;
  return result;
}

function getValueByPath(obj, path) {
  return path.split('.').reduce((o, p) => o && o[p], obj);
}

// DOMContentLoaded 事件监听器
document.addEventListener('DOMContentLoaded', function() {
  const paneCountRadios = document.getElementsByName('paneCount');
  const jsonInputs = document.getElementById('jsonInputs');
  const clearAllButton = document.getElementById('clearAll');
  const compareButton = document.getElementById('compare');

  paneCountRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.checked) {
        createJsonInputs(parseInt(this.value));
      }
    });
  });

  clearAllButton.addEventListener('click', clearAllData);
  compareButton.addEventListener('click', compareJsonData);

  // 初始化：创建默认的 JSON 输入框
  createJsonInputs(2); // 默认创建 2 个分隔栏
});