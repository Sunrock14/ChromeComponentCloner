document.addEventListener('DOMContentLoaded', function() {  
  const toggleButton = document.getElementById('toggleSelection');  
  const cloneButton = document.getElementById('cloneComponent');  
  const openPageButton = document.getElementById('openClonedPage');  
  const statusEl = document.getElementById('status');  
  const preview = document.getElementById('preview');  
  const previewContent = document.getElementById('previewContent');  
  
  let selectionModeActive = false;  
  let selectedComponent = null;  
  
  // İlk durum kontrolü  
  chrome.storage.local.get(['selectionModeActive', 'selectedComponent'], function(result) {  
    selectionModeActive = result.selectionModeActive || false;  
    selectedComponent = result.selectedComponent || null;  
    
    updateUIState();  
    
    if (selectedComponent) {  
      showPreview(selectedComponent);  
      cloneButton.disabled = false;  
      openPageButton.disabled = false;  
    }  
  });  
  
  // Seçim modunu aç/kapa butonu  
  toggleButton.addEventListener('click', function() {  
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {  
      if (!tabs || tabs.length === 0) {  
        updateStatus("Hata: Aktif bir sekme bulunamadı", "error");  
        return;  
      }  
      
      chrome.tabs.sendMessage(  
        tabs[0].id,   
        {action: "toggleSelectionMode"},  
        function(response) {  
          if (chrome.runtime.lastError) {  
            // İletişim hatası  
            console.error(chrome.runtime.lastError);  
            updateStatus("Hata: Sayfayla iletişim kurulamadı. Sayfayı yenileyin veya farklı bir sayfada deneyin.", "error");  
            return;  
          }  
          
          if (response && response.status === "success") {  
            selectionModeActive = response.selectionModeActive;  
            chrome.storage.local.set({selectionModeActive: selectionModeActive});  
            updateUIState();  
          } else {  
            updateStatus("Beklenmedik cevap alındı", "error");  
          }  
        }  
      );  
    });  
  });  
  
  // Komponenti klonla butonu  
  cloneButton.addEventListener('click', function() {  
    chrome.storage.local.get('selectedComponent', function(result) {  
      if (result.selectedComponent) {  
        // Klonlanmış sayfayı açma butonunu aktifleştir  
        openPageButton.disabled = false;  
        updateStatus("Komponent başarıyla klonlandı", "success");  
      } else {  
        updateStatus("Hata: Klonlanacak komponent bulunamadı", "error");  
      }  
    });  
  });  
  
  // Klonlanmış sayfayı aç butonu  
  openPageButton.addEventListener('click', function() {  
    chrome.runtime.sendMessage({action: "componentCloned"});  
  });  
  
  // Mesaj dinleyicisi  
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {  
    if (message.action === "elementSelected") {  
      selectedComponent = {  
        html: message.html,  
        styles: message.styles  
      };  
      
      // Komponenti kaydet  
      chrome.storage.local.set({selectedComponent: selectedComponent});  
      
      // Arayüzü güncelle  
      showPreview(selectedComponent);  
      cloneButton.disabled = false;  
      openPageButton.disabled = false;  
      updateStatus("Komponent başarıyla seçildi", "success");  
      
      sendResponse({status: "success"});  
    } else if (message.action === "selectionError" || message.action === "selectionCancelled") {  
      updateStatus("Seçim hatası: " + (message.error || message.reason || "Bilinmeyen hata"), "error");  
      selectionModeActive = false;  
      updateUIState();  
    }  
    return true;  
  });  
  
  // UI güncelleme  
  function updateUIState() {  
    if (selectionModeActive) {  
      toggleButton.textContent = "Seçim Modunu Kapat";  
      statusEl.textContent = "Seçim modu: Aktif - Sayfada bir komponent seçin";  
      statusEl.className = "status active";  
    } else {  
      toggleButton.textContent = "Komponent Seçmeyi Başlat";  
      statusEl.textContent = "Seçim modu: Pasif";  
      statusEl.className = "status inactive";  
    }  
  }  
  
  // Durum mesajı güncelleme  
  function updateStatus(message, type) {  
    statusEl.textContent = message;  
    
    if (type === "error") {  
      statusEl.className = "status inactive";  
    } else if (type === "success") {  
      statusEl.className = "status active";  
    }  
  }  
  
  // Önizleme gösterme  
  function showPreview(component) {  
    if (!component || !component.html) {  
      preview.classList.add('hidden');  
      return;  
    }  
    
    preview.classList.remove('hidden');  
    
    // Basit HTML sanitizasyonu (Gerçek uygulamada daha güvenli bir yöntem kullanılmalı)  
    const sanitizedHTML = component.html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');  
    
    previewContent.innerHTML = `  
      <p><strong>HTML:</strong></p>  
      <pre style="overflow:auto; max-height:100px;">${escapeHTML(sanitizedHTML)}</pre>  
      <p><strong>Styles:</strong></p>  
      <pre style="overflow:auto; max-height:100px;">${escapeHTML(component.styles || '')}</pre>  
    `;  
  }  
  
  // HTML içeriğini escape etme  
  function escapeHTML(str) {  
    if (!str) return '';  
    return str  
      .replace(/&/g, '&amp;')  
      .replace(/</g, '&lt;')  
      .replace(/>/g, '&gt;')  
      .replace(/"/g, '&quot;')  
      .replace(/'/g, '&#039;');  
  }  
});  