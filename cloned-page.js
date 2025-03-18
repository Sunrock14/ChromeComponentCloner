document.addEventListener('DOMContentLoaded', function() {
  const componentWrapper = document.getElementById('componentWrapper');
  const htmlCodeElement = document.getElementById('htmlCode');
  const cssCodeElement = document.getElementById('cssCode');
  const downloadBtn = document.getElementById('downloadBtn');
  
  // Depolanan komponenti al
  chrome.storage.local.get(['selectedComponent', 'defaultClonedContent'], function(result) {
    if (result.selectedComponent) {
      const component = result.selectedComponent;
      
      // Komponenti göster
      const styleElement = document.createElement('style');
      styleElement.textContent = `.cloned-component { ${component.styles} }`;
      componentWrapper.appendChild(styleElement);
      
      const componentElement = document.createElement('div');
      componentElement.className = 'cloned-component';
      componentElement.innerHTML = component.html;
      componentWrapper.appendChild(componentElement);
      
      // Kodları göster
      htmlCodeElement.textContent = component.html;
      cssCodeElement.textContent = component.styles;
      
      // İndirme butonu
      downloadBtn.addEventListener('click', function() {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Cloned Component</title>
            <style>
              ${component.styles}
            </style>
          </head>
          <body>
            ${component.html}
          </body>
          </html>
        `;
        
        // Bu sayfa içinde URL.createObjectURL kullanılabilir (service worker değil)
        const blob = new Blob([htmlContent], {type: 'text/html'});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cloned-component.html';
        document.body.appendChild(a);
        a.click();
        
        setTimeout(function() {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 0);
      });
    } else {
      // Default içerik göster
      if (result.defaultClonedContent) {
        componentWrapper.innerHTML = result.defaultClonedContent;
      } else {
        componentWrapper.innerHTML = `
          <div class="message">
            <p>Henüz klonlanmış bir komponent bulunmamaktadır.</p>
            <p>Lütfen bir web sayfasına gidin ve uzantıyı kullanarak bir komponent seçin.</p>
          </div>
        `;
      }
      
      downloadBtn.disabled = true;
      htmlCodeElement.textContent = "Herhangi bir komponent seçilmedi";
      cssCodeElement.textContent = "Herhangi bir komponent seçilmedi";
    }
  });
});
