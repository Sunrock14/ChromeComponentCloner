// Seçim modunu aktif edecek değişken  
let selectionModeActive = false;  
let highlightedElement = null;  
let highlightOverlay = null;  

// Mesaj dinleyici  
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {  
  if (message.action === "toggleSelectionMode") {  
    selectionModeActive = !selectionModeActive;  
    
    if (selectionModeActive) {  
      // Seçim modu aktif edildiğinde  
      activateSelectionMode();  
    } else {  
      // Seçim modu devre dışı bırakıldığında  
      deactivateSelectionMode();  
    }  
    
    sendResponse({ status: "success", selectionModeActive });  
  } else if (message.action === "getClonedComponent") {  
    // Son seçilen komponenti gönder  
    if (highlightedElement) {  
      const clonedHTML = highlightedElement.outerHTML;  
      const styles = extractAppliedStyles(highlightedElement);  
      sendResponse({   
        status: "success",   
        html: clonedHTML,  
        styles: styles   
      });  
    } else {  
      sendResponse({ status: "error", message: "No element selected" });  
    }  
  }  
  return true; // Asenkron cevap için gerekli  
});  

// Seçim modunu aktifleştiren fonksiyon  
function activateSelectionMode() {  
  // Eklenti stillerini oluştur  
  createHighlightOverlay();  
  
  // Mouse hareketini dinle  
  document.addEventListener('mousemove', handleMouseMove);  
  document.addEventListener('click', handleElementClick);  
  
  // Sağ tıklamayı engelle  
  document.addEventListener('contextmenu', preventDefaultAction);  
  
  // Body'ye cursor pointer ekle  
  document.body.style.cursor = 'pointer';  
}  

// Seçim modunu devre dışı bırakan fonksiyon  
function deactivateSelectionMode() {  
  // Dinleyicileri kaldır  
  document.removeEventListener('mousemove', handleMouseMove);  
  document.removeEventListener('click', handleElementClick);  
  document.removeEventListener('contextmenu', preventDefaultAction);  
  
  // Highlight overlay'i kaldır  
  if (highlightOverlay) {  
    document.body.removeChild(highlightOverlay);  
    highlightOverlay = null;  
  }  
  
  // Cursor'u normale çevir  
  document.body.style.cursor = 'default';  
  
  // NOT: highlightedElement'i burada null yapmıyoruz çünkü  
  // seçilen elementin bilgisini tutmak istiyoruz  
}  

// Mouse hareketi işleyicisi  
function handleMouseMove(e) {  
  if (!selectionModeActive) return;  
  
  // Event'in orijinal hedefini al (bubble değil)  
  const targetElement = document.elementFromPoint(e.clientX, e.clientY);  
  if (!targetElement) return;  
  
  // Hedef elementi highlight et  
  highlightElement(targetElement);  
  
  // Son seçilen elementi kaydet  
  highlightedElement = targetElement;  
}  

// Tıklama işleyicisi  
function handleElementClick(e) {  
  if (!selectionModeActive) return;  
  
  // Tıklamayı engelle  
  e.preventDefault();  
  e.stopPropagation();  
  
  // Güvenlik kontrolü: Hâlâ bir element seçili mi?  
  if (highlightedElement === null) {  
    console.warn("Component seçilmedi - önce bir component üzerine gelin");  
    // Seçim modunu devre dışı bırak  
    deactivateSelectionMode();  
    chrome.runtime.sendMessage({  
      action: "selectionCancelled",  
      reason: "No element selected"  
    });  
    return;  
  }  
  
  // Element geçerli mi kontrol et  
  try {  
    // Bu satır element geçersizse hata verecek  
    const testAccess = highlightedElement.tagName;  
    
    // Seçim modunu kapat  
    deactivateSelectionMode();  
    
    // Seçilen komponenti bildir  
    chrome.runtime.sendMessage({  
      action: "elementSelected",  
      html: highlightedElement.outerHTML,  
      styles: extractAppliedStyles(highlightedElement)  
    });  
  } catch (error) {  
    console.error("Element erişimi hatası:", error);  
    // Seçim modunu kapat  
    deactivateSelectionMode();  
    // Hata mesajı gönder  
    chrome.runtime.sendMessage({  
      action: "selectionError",  
      error: error.message  
    });  
  }  
}  

// Varsayılan eylemi engelleyen fonksiyon  
function preventDefaultAction(e) {  
  if (selectionModeActive) {  
    e.preventDefault();  
    return false;  
  }  
}  

// Highlight Overlay oluşturma  
function createHighlightOverlay() {  
  // Mevcut overlay varsa kaldır  
  if (highlightOverlay) {  
    try {  
      document.body.removeChild(highlightOverlay);  
    } catch (e) {  
      console.warn("Existing overlay removal failed", e);  
    }  
  }  
  
  highlightOverlay = document.createElement('div');  
  highlightOverlay.id = 'component-cloner-highlight';  
  highlightOverlay.style.position = 'absolute';  
  highlightOverlay.style.border = '2px dashed #4285F4';  
  highlightOverlay.style.backgroundColor = 'rgba(66, 133, 244, 0.1)';  
  highlightOverlay.style.zIndex = '99999';  
  highlightOverlay.style.pointerEvents = 'none';  
  document.body.appendChild(highlightOverlay);  
}  

// Element highlight etme  
function highlightElement(element) {  
  if (!highlightOverlay || !element) return;  
  
  try {  
    const rect = element.getBoundingClientRect();  
    
    highlightOverlay.style.left = `${rect.left + window.scrollX}px`;  
    highlightOverlay.style.top = `${rect.top + window.scrollY}px`;  
    highlightOverlay.style.width = `${rect.width}px`;  
    highlightOverlay.style.height = `${rect.height}px`;  
    highlightOverlay.style.display = 'block';  
  } catch (error) {  
    console.warn("Element highlight hatası:", error);  
  }  
}  

// Elemanın uygulanmış stillerini çıkaran fonksiyon  
function extractAppliedStyles(element) {  
  if (!element) return '';  
  
  try {  
    let styles = '';  
    const computedStyle = window.getComputedStyle(element);  
    
    // Önemli stiller  
    const importantStyles = [  
      'display', 'position', 'width', 'height', 'margin', 'padding',  
      'color', 'background', 'font-family', 'font-size', 'border',  
      'flex', 'grid', 'align-items', 'justify-content'  
    ];  
    
    importantStyles.forEach(style => {  
      const value = computedStyle.getPropertyValue(style);  
      if (value) {  
        styles += `${style}: ${value};\n`;  
      }  
    });  
    
    return styles;  
  } catch (error) {  
    console.error("Style extraction error:", error);  
    return '/* Style extraction failed */';  
  }  
}  