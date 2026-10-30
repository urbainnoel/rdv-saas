/*
 * Widget intégrable RDV Assistant.
 * À coller sur le site de l'entrepreneur :
 *   <script src="https://.../widget.js" data-slug="son-slug" defer></script>
 *
 * Fait apparaître une bulle de chat flottante sur SON site, qui ouvre un
 * panneau (iframe) chargé depuis notre app — même assistant, même
 * bibliothèque de connaissances, même moteur de réservation, juste affiché
 * ailleurs. Écrit en JS simple (pas de build), pour tourner sur n'importe
 * quel site sans dépendance.
 */
(function () {
  var currentScript =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName("script");
      for (var i = scripts.length - 1; i >= 0; i--) {
        if (scripts[i].src && scripts[i].src.indexOf("widget.js") !== -1) return scripts[i];
      }
      return null;
    })();

  if (!currentScript) return;

  var slug = currentScript.getAttribute("data-slug");
  if (!slug) {
    console.error("[RDV Assistant] widget.js : l'attribut data-slug est requis sur la balise <script>.");
    return;
  }

  var origin = new URL(currentScript.src).origin;
  var open = false;

  var FOREST = "#0b7a50"; // couleur par défaut, remplacée dès que la couleur de marque est connue

  var bubble = document.createElement("button");
  bubble.setAttribute("aria-label", "Ouvrir l'assistant");
  bubble.style.cssText =
    "position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:9999px;" +
    "background:" + FOREST + ";color:#fff;border:none;cursor:pointer;z-index:2147483000;" +
    "box-shadow:0 8px 24px rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center;" +
    "transition:transform .15s ease;";
  bubble.onmouseenter = function () {
    bubble.style.transform = "scale(1.06)";
  };
  bubble.onmouseleave = function () {
    bubble.style.transform = "scale(1)";
  };

  var iconOpen =
    '<svg viewBox="0 0 24 24" fill="none" width="24" height="24"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8A2.5 2.5 0 0 1 17.5 17H9l-4 3.5V6.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  var iconClose =
    '<svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  var logoHtml = null; // rempli une fois le logo de l'entrepreneur récupéré, s'il en a un
  bubble.innerHTML = iconOpen;

  var panelWrap = document.createElement("div");
  panelWrap.style.cssText =
    "position:fixed;bottom:88px;right:20px;width:min(380px, calc(100vw - 32px));" +
    "height:min(600px, calc(100vh - 140px));border-radius:16px;overflow:hidden;" +
    "box-shadow:0 16px 48px rgba(0,0,0,.22);z-index:2147483000;display:none;" +
    "background:#fff;border:1px solid rgba(0,0,0,.08);";

  var iframe = document.createElement("iframe");
  iframe.src = origin + "/embed/" + encodeURIComponent(slug);
  iframe.style.cssText = "width:100%;height:100%;border:none;display:block;";
  iframe.title = "Assistant de réservation";
  panelWrap.appendChild(iframe);

  function setOpen(next) {
    open = next;
    panelWrap.style.display = open ? "block" : "none";
    bubble.innerHTML = open ? iconClose : logoHtml || iconOpen;
    bubble.setAttribute("aria-label", open ? "Fermer l'assistant" : "Ouvrir l'assistant");
  }

  bubble.addEventListener("click", function () {
    setOpen(!open);
  });

  document.body.appendChild(panelWrap);
  document.body.appendChild(bubble);

  // On va chercher la couleur de marque de l'entrepreneur pour que la bulle
  // (rendue directement sur SON site, donc hors de notre CSS) corresponde à
  // sa charte graphique plutôt que de rester systématiquement verte.
  fetch(origin + "/api/public/branding?slug=" + encodeURIComponent(slug))
    .then(function (res) {
      return res.ok ? res.json() : null;
    })
    .then(function (data) {
      if (data && data.brandColor) {
        bubble.style.background = data.brandColor;
      }
      if (data && data.logoUrl) {
        logoHtml =
          '<img src="' +
          data.logoUrl +
          '" alt="" style="width:32px;height:32px;border-radius:9999px;object-fit:cover;" />';
        bubble.style.padding = "0";
        bubble.style.overflow = "hidden";
        if (!open) bubble.innerHTML = logoHtml;
      }
    })
    .catch(function () {
      // Pas grave : la bulle garde la couleur par défaut.
    });
})();
