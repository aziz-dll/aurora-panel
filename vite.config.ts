import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/* Chrome 64 (J7 Prime WebView) uyumluluk yamaları — build sonrası CSS'e uygulanır:
   1) @layer bloklarının açılması   → @layer Chrome 64'te parse edilmez, İÇİNDEKİ
                                      TÜM KURALLAR DÜŞER (siyah ekranın nedeni)
   2) :where(X) → X, :is(a,b) → a,b → bu pseudo'lar Chrome 88'de geldi; parse
                                      hatası seçicinin tamamını geçersiz kılar
   3) :lang(ae..) RTL/LTR preflight blokları silinir (kullanılmıyor)
   KRİTİK: :is/:where düzleştirme iç virgülleri SADECE parantez derinliği 0'da
   böler ve prefix/suffix'i her dala dağıtır (.card :where(h1,h2) → .card h1,.card h2). */
function chrome64Compat(): Plugin {
  const transform = (css: string): string => {
    const unwrap = (css: string, name: string): string => {
      let out = '';
      let i = 0;
      for (;;) {
        const marker = `@layer ${name}{`;
        const j = css.indexOf(marker, i);
        if (j < 0) { out += css.slice(i); break; }
        out += css.slice(i, j);
        let depth = 1;
        let k = j + marker.length;
        while (depth > 0 && k < css.length) {
          if (css[k] === '{') depth++;
          else if (css[k] === '}') depth--;
          k++;
        }
        out += css.slice(j + marker.length, k - 1);
        i = k;
      }
      return out;
    };
    for (const l of ['theme', 'base', 'components', 'utilities', 'properties']) {
      css = unwrap(css, l);
    }
    css = css.replace(/@layer\s+[a-z,\s]+;/g, '');
    css = css.replace(/[^{}]*:lang\(ae\)[^{}]*\{[^{}]*\}/g, '');

    const splitTopLevel = (inner: string): string[] => {
      const parts: string[] = [];
      let depth = 0, start = 0;
      for (let i = 0; i < inner.length; i++) {
        const ch = inner[i];
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
        else if (ch === ',' && depth === 0) {
          parts.push(inner.slice(start, i));
          start = i + 1;
        }
      }
      parts.push(inner.slice(start));
      return parts;
    };
    const flattenPseudo = (sel: string, name: string): string => {
      const token = ':' + name + '(';
      const j = sel.indexOf(token);
      if (j < 0) return sel;
      let depth = 1;
      let k = j + token.length;
      while (depth > 0 && k < sel.length) {
        if (sel[k] === '(') depth++;
        else if (sel[k] === ')') depth--;
        k++;
      }
      const inner = sel.slice(j + token.length, k - 1);
      const prefix = sel.slice(0, j);
      const suffix = sel.slice(k);
      return splitTopLevel(inner)
        .map((b) => prefix + b.trim() + suffix)
        .join(',');
    };
    css = css.replace(/([^{}]+)\{/g, (m, sel: string) => {
      if (sel.includes(':is(') || sel.includes(':where(')) {
        let s = sel;
        for (let i = 0; i < 8; i++) {
          if (s.includes(':is(')) s = flattenPseudo(s, 'is');
          if (s.includes(':where(')) s = flattenPseudo(s, 'where');
          if (!s.includes(':is(') && !s.includes(':where(')) break;
        }
        return s + '{';
      }
      return m;
    });
    return css;
  };
  return {
    name: 'chrome64-compat',
    apply: 'build',
    generateBundle(_opts, bundle) {
      for (const file of Object.values(bundle) as Array<{ type: string; fileName: string; source?: string }>) {
        if (file.type === 'asset' && String(file.fileName).endsWith('.css')) {
          file.source = transform(String(file.source));
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), chrome64Compat()],
  build: {
    // J7 Prime'daki eski sistem WebView (Chrome 64 / Android 7) bundle'ı
    // parse edebilsin diye: varsayılan 'modules' hedefi `?.` sözdizimini
    // olduğu gibi bırakır → panel iframe'i hiç çalışmaz.
    target: 'es2018',
    cssTarget: 'chrome64',
  },
  server: {
    allowedHosts: true,
    proxy: {
      '/api': 'http://127.0.0.1:8788',
    },
  },
});
