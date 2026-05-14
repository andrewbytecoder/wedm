


// 应用字体设置
export function applyFontSettings(fontFamily:string, fontSize:number) {
    const root = document.documentElement;
    root.style.setProperty('--app-font-family', fontFamily);
    root.style.setProperty('--app-font-size', `${fontSize}px`);

    // 直接应用到 body 元素
    document.body.style.fontFamily = fontFamily;
    document.body.style.fontSize = `${fontSize}px`;
}
