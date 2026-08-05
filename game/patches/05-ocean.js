    /* ------------------------------------------------------------------
       شبكة الماء: كانت مربّعات بعرض ‎37م‏ بينما طول الموجة ‎12–34م‏، فكان
       الموج يُحسب ولا يُرى. نُعيد توزيع رؤوس الشبكة توزيعاً أُسّياً:
       كثيفة جداً عند الكاميرا (‎~60سم‏) ثم تتباعد حتى الأفق — فيظهر
       الموج مجسّماً قربك، ويبقى البحر ممتدّاً إلى آخر المدى.
       ------------------------------------------------------------------ */
    function radialGrid(geo, size) {
      var pos = geo.attributes && geo.attributes.position;
      if (!pos) return;
      var half = size * 0.5;
      var A = half / 120, B = 4.8;          /* ‎newR = A·(e^{B·rn} − 1)‎ */
      var cap = half * 2.6;
      for (var i = 0; i < pos.count; i++) {
        var x = pos.getX(i), y = pos.getY(i);
        var r = Math.sqrt(x * x + y * y);
        if (r < 1e-5) continue;
        var nr = A * (Math.exp(B * (r / half)) - 1);
        if (nr > cap) nr = cap;
        var k = nr / r;
        pos.setX(i, x * k); pos.setY(i, y * k);
      }
      pos.needsUpdate = true;
      try { geo.computeBoundingSphere(); } catch (e) { }
    }

    /* لون السماء/الضباب: يذوب فيه البحر عند الأفق فلا يبقى خطّ قاطع */
    var T2 = window.__ROYAL_THREE__;
    var skyCol = null, fogD = 0.0007;
    try {
      if (game.scene && game.scene.fog) {
        if (game.scene.fog.color) skyCol = game.scene.fog.color.clone();
        if (typeof game.scene.fog.density === "number") fogD = game.scene.fog.density;
      }
    } catch (e) { }
    if (!skyCol && T2 && T2.Color) skyCol = new T2.Color(0.52, 0.66, 0.82);
    U.uSky = { value: skyCol };
    U.uFogD = { value: OPT.oceanSky === false ? 0 : fogD };

    o.material.vertexShader = [
      "varying vec2 vUv; varying vec3 vW; varying float vWave;",
      "uniform float t;",
      "float sw(vec2 p, vec2 d, float len, float sp){ return sin(dot(p,d)/len + t*sp); }",
      "void main(){",
      "  vec4 wp = modelMatrix*vec4(position,1.0);",
      /* نطاق الضجيج من إحداثيّات العالم لا من uv: فلا «يسبح» النسيج مع
         الكاميرا (لوح الماء يتبعها) ولا يتمدّد مع شبكتنا غير المنتظمة */
      "  vUv = wp.xz/150.0;",
      "  float w = 0.0;",
      "  w += sw(wp.xz, normalize(vec2( 1.0, 0.35)), 34.0, 0.55)*0.85;",
      "  w += sw(wp.xz, normalize(vec2(-0.4, 1.0 )), 21.0, 0.80)*0.45;",
      "  w += sw(wp.xz, normalize(vec2( 0.7,-0.7 )), 12.0, 1.15)*0.22;",
      "  w += sw(wp.xz, normalize(vec2(-0.9,-0.2 )),  6.5, 1.60)*0.10;",
      "  vWave = w;",
      "  wp.y += w;",
      "  vW = wp.xyz;",
      "  gl_Position = projectionMatrix*viewMatrix*wp;",
      "}"
    ].join("\n");
    o.material.fragmentShader = [
      "uniform float t; uniform vec3 cA,cB,cS,uSky; uniform vec3 uCam;",
      "uniform sampler2D uH; uniform float uHas,uMinX,uMinZ,uSpan,uYlo,uYrng,uWater,uShore,uFogD;",
      "varying vec2 vUv; varying vec3 vW; varying float vWave;",
      /* عمق الماء عند هذه النقطة من خريطة ارتفاع الأرض */
      "float dec(vec4 T){ return uYlo + (T.r*255.0*256.0 + T.g*255.0)/65535.0*uYrng; }",
      "float depthAt(vec2 p){",
      "  if(uHas < 0.5) return 99.0;",
      "  vec2 uv = vec2((p.x-uMinX)/uSpan, (p.y-uMinZ)/uSpan);",
      "  if(uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0) return 99.0;",
      /* نأخذ أعلى ارتفاع بين النقطة وجيرانها: الأرض تكسب دائماً عند الحافّة
         فلا يتسرّب الماء فوق اليابسة ولا يخرج من تحتها مهما دقّت الحافّة */
      "  float px = 1.6/uSpan;",
      "  float h = -1e9;",
      "  h = max(h, dec(texture2D(uH, uv)));",
      "  h = max(h, dec(texture2D(uH, uv+vec2( px,0.0))));",
      "  h = max(h, dec(texture2D(uH, uv+vec2(-px,0.0))));",
      "  h = max(h, dec(texture2D(uH, uv+vec2(0.0, px))));",
      "  h = max(h, dec(texture2D(uH, uv+vec2(0.0,-px))));",
      "  h = max(h, dec(texture2D(uH, uv+vec2( px, px))));",
      "  h = max(h, dec(texture2D(uH, uv+vec2(-px,-px))));",
      "  return uWater - h;",
      "}",
      "float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }",
      "float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);",
      "  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }",
      "float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*n(p); p*=2.02; a*=0.5; } return v; }",
      "void main(){",
      "  vec2 q = vUv;",
      "  float w1 = fbm(q*1.15 + vec2(t*0.040, t*0.026));",
      "  float w2 = fbm(q*3.10 - vec2(t*0.070, t*0.046));",
      "  float w3 = fbm(q*7.40 + vec2(t*0.130,-t*0.090));",
      "  float w  = w1*0.55 + w2*0.30 + w3*0.15;",
      "  float e = 0.5;",
      "  float dx  = fbm((q+vec2(e,0.0))*1.15 + vec2(t*0.040,t*0.026)) - w1;",
      "  float dz  = fbm((q+vec2(0.0,e))*1.15 + vec2(t*0.040,t*0.026)) - w1;",
      "  float dx2 = fbm((q+vec2(e,0.0))*3.10 - vec2(t*0.070,t*0.046)) - w2;",
      "  float dz2 = fbm((q+vec2(0.0,e))*3.10 - vec2(t*0.070,t*0.046)) - w2;",
      "  vec3 nrm = normalize(vec3(-(dx*3.0+dx2*1.6), 1.0, -(dz*3.0+dz2*1.6)));",
      "  vec3 V = normalize(uCam - vW);",
      "  float fres = pow(1.0 - max(dot(nrm,V),0.0), 4.0);",
      "  float dist = length(vW.xz - uCam.xz);",
      "  float far = smoothstep(90.0, 700.0, dist);",       /* تلاشي التفاصيل مع البُعد */
      "  float deep = smoothstep(40.0, 800.0, dist);",
      "  vec3 c = mix(cB, cA, deep);",
      "  c *= 1.0 + (0.24*smoothstep(-1.0, 1.0, vWave) - 0.14)*(1.0-far);",
      /* انعكاس السماء: كلّما مال نظرك على السطح رأيت السماء فيه */
      "  c = mix(c, cS, fres*0.42);",
      "  c = mix(c, uSky, fres*0.34);",
      "  vec3 L = normalize(vec3(0.55,0.72,0.42));",
      "  float spec = pow(max(dot(reflect(-L,nrm),V),0.0), 140.0);",
      "  c += vec3(1.0,0.97,0.88) * spec * 1.35 * (1.0 - far*0.55);",
      /* طريق الشمس: بريقٌ ممدود على الماء بدل نقطة واحدة */
      "  float glit = pow(max(dot(reflect(-L,nrm),V),0.0), 24.0) * (0.35+0.65*w3);",
      "  c += vec3(1.0,0.96,0.85) * glit * 0.24 * (1.0-deep*0.5) * (1.0-far*0.7);",
      "  float crest = smoothstep(0.55, 1.35, vWave);",
      "  float foam = smoothstep(0.74,0.94,w) + crest*0.55;",
      "  c = mix(c, vec3(0.93,0.98,1.0), clamp(foam,0.0,1.0)*0.32*(1.0-far));",
      "  vec3 sheet = mix(cB, cA, 0.55)*1.06;",              /* لون صفحة البحر البعيدة */
      "  c = mix(c, sheet, far*0.82);",
      "  float hz = smoothstep(1400.0, 3200.0, dist);",
      "  c = mix(c, sheet*1.1, hz*0.5);",
      /* ---- عمق الماء: ضحل فيروزي عند الشاطئ ثم أزرق غامق في العمق ---- */
      "  float dep = depthAt(vW.xz);",
      "  float band = max(0.15, uShore);",
      "  float a = smoothstep(0.0, band, dep);",
      "  if(a <= 0.004) discard;",
      "  float shal = 1.0 - smoothstep(0.6, 13.0, dep);",
      "  vec3 cSh = mix(cB, vec3(0.36,0.90,0.88), 0.42);",
      "  c = mix(c, cSh, shal*0.72);",
      "  float shore = 1.0 - smoothstep(0.0, band*2.4, dep);",
      /* خطّ زَبَد يتنفّس مع الموج على طول الشاطئ */
      "  float lace = 0.5 + 0.5*sin(t*1.6 + w3*20.0 + w2*9.0);",
      "  float edge = smoothstep(0.15, 0.85, shore) * (0.55 + 0.45*lace);",
      "  c = mix(c, vec3(0.96,0.995,1.0), clamp(edge,0.0,1.0)*0.7);",
      /* قاع رملي يشفّ من تحت الماء الضحل */
      "  a = mix(a, min(a, 0.55 + 0.45*smoothstep(0.5,4.0,dep)), shal);",
      /* ---- الأفق: نُطبّق ضباب المشهد يدوياً فيلتقي البحر بالسماء ---- */
      "  if(uFogD > 0.0){",
      "    float dd = length(vW - uCam) * uFogD;",
      "    float fg = 1.0 - exp(-dd*dd);",
      "    c = mix(c, uSky, clamp(fg,0.0,1.0));",
      "    a = mix(a, 1.0, clamp(fg,0.0,1.0)*0.85);",
      "  }",
      "  gl_FragColor = vec4(c, a);",
      "}"
    ].join("\n");
