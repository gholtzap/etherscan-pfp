document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('icon-type');
  
    chrome.storage.sync.get({ iconType: 'identicon' }, (data) => {
      select.value = data.iconType;
    });
  
    select.addEventListener('change', () => {
      const selected = select.value;
      chrome.storage.sync.set({ iconType: selected });
    });
  });
  