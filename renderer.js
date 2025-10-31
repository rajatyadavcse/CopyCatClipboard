// Simple renderer: receives history, renders list, sends click events to main.
// No complex APIs, matches the simplified main.js behavior.

const { ipcRenderer } = require('electron');

const listEl = document.getElementById('history');
const toast = document.getElementById('toast');

function showToast(msg = 'Copied to clipboard') {
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = 'block';
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toast.style.display = 'none';
  }, 900);
}

// Render function: replaces contents of the list
function renderHistory(history) {
  listEl.innerHTML = '';
  if (!Array.isArray(history) || history.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No items yet — copy something to populate history';
    li.style.opacity = '0.6';
    li.style.cursor = 'default';
    li.classList.add('empty');
    listEl.appendChild(li);
    return;
  }

  history.forEach((item) => {
    const li = document.createElement('li');
    li.title = item;
    // show short preview
    li.textContent = item.length > 120 ? item.slice(0, 120) + '…' : item;
    li.onclick = () => {
      // Tell main process to copy this item to clipboard
      ipcRenderer.send('paste-item', item);

      // Show confirmation toast — user still needs to press Cmd/Ctrl+V to paste
      // Show toast message for 2 seconds
      const toast = document.getElementById('toast');
      const isMac = process.platform === 'darwin';
      toast.textContent = `Copied! Press ${isMac ? '⌘' : 'Ctrl'} + V to paste`;
      toast.style.display = 'block';
      setTimeout(() => (toast.style.opacity = 1.5), 10);

      setTimeout(() => {
        toast.style.opacity = 0;
        setTimeout(() => {
          toast.style.display = 'none';
          ipcRenderer.send('hide-window'); // then hide the window (like before)
        }, 300);
      }, 1400);
      //showToast('Copied to clipboard — press Cmd/Ctrl+V to paste');
    };
    listEl.appendChild(li);
  });
}

// Listen for updates from main process
ipcRenderer.on('update-history', (event, history) => {
  try {
    renderHistory(history);
  } catch (e) {
    console.error('Error rendering history', e);
  }
});

// When the renderer loads, request current history (main will respond via update-history)
window.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('close-btn');
  const clearBtn = document.getElementById('clear-btn');

  ipcRenderer.send('request-history');
  
  closeBtn.addEventListener('click', () => {
    ipcRenderer.send('hide-window');
  });
  
  clearBtn.addEventListener('click', () => {
    ipcRenderer.send('clear-history');
  });
});

