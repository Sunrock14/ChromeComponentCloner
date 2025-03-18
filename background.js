// Service worker olarak çalışan background script  
// URL.createObjectURL kullanımını kaldırıyoruz  

// Mesaj dinleyicisi  
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {  
  if (message.action === "componentCloned") {  
    // Yeni bir sekmede aç  
    chrome.tabs.create({url: 'cloned-page.html'});  
  }  
  return true;  
});  

// Chrome uzantısını ilk kurduğunda veya güncellediğinde  
chrome.runtime.onInstalled.addListener(function() {  
  // Başlangıç durumunu ayarla  
  chrome.storage.local.set({  
    selectionModeActive: false,  
    selectedComponent: null  
  });  
  
  // Varsayılan klonlanmış sayfa içeriğini kaydet  
  const clonedPageContent = `  
    <div class="message">  
      <p>Henüz klonlanmış bir komponent bulunmamaktadır.</p>  
      <p>Lütfen bir web sayfasına gidin ve uzantıyı kullanarak bir komponent seçin.</p>  
    </div>  
  `;  
  
  // Doğrudan HTML içeriğini kaydet, Blob URL oluşturma  
  chrome.storage.local.set({  
    defaultClonedContent: clonedPageContent  
  });  
});  