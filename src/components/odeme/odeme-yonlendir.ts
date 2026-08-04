"use client";

// Sipariş uçlarından dönen `odeme` nesnesini alıp kullanıcıyı 3D ekranına götürür.
// İki sağlayıcının çıktısı farklıdır; çağıran taraf ayrımı bilmez.

export type OdemeYaniti =
  | { saglayici: "QNB"; tip: "form"; paymentForm: { url: string; fields: Record<string, string> } }
  | { saglayici: "DIJIGATE"; tip: "html"; htmlContent: string; paymentId: string };

export function odemeyeGit(odeme: OdemeYaniti): void {
  if (odeme.tip === "form") {
    // QNB 3DHost: gizli alanlı formu bankanın gate adresine POST et.
    const f = document.createElement("form");
    f.method = "POST";
    f.action = odeme.paymentForm.url;
    for (const [k, v] of Object.entries(odeme.paymentForm.fields)) {
      const i = document.createElement("input");
      i.type = "hidden";
      i.name = k;
      i.value = v;
      f.appendChild(i);
    }
    document.body.appendChild(f);
    f.submit();
    return;
  }

  // DijiGate: 3ds-init'ten dönen HTML bankanın kendi kendine gönderilen 3D formudur.
  // Mevcut belgeyi bununla değiştiriyoruz; form yüklenir yüklenmez bankaya gider.
  document.open();
  document.write(odeme.htmlContent);
  document.close();
}
