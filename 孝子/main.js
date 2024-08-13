var docCookies = {
    getItem: function (sKey) {
        return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[-.+*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
    },
    setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
        if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
        var sExpires = "";
        if (vEnd) {
            switch (vEnd.constructor) {
                case Number:
                    sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
                    break;
                case String:
                    sExpires = "; expires=" + vEnd;
                    break;
                case Date:
                    sExpires = "; expires=" + vEnd.toUTCString();
                    break;
            }
        }
        document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
        return true;
    },
    removeItem: function (sKey, sPath, sDomain) {
        if (!sKey || !this.hasItem(sKey)) { return false; }
        document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "");
        return true;
    },
    hasItem: function (sKey) {
        return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[-.+*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
    },
    keys: /* optional method: you can safely remove it! */ function () {
        var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
        for (var nIdx = 0; nIdx < aKeys.length; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
        return aKeys;
    }
};

marked.use({
    async: false,
    pedantic: false,
    gfm: true,
    mangle: false,
    headerIds: false
});

// 从cookie中获取用户的theme
let theme = docCookies.getItem('theme');
if (theme == null) {
    console.log('Set cookies for saving the theme');
    docCookies.setItem(name = 'theme', value = 'auto', end = Infinity, domain = window.location.host)
    theme = 'auto';
} else {
    console.log('Got theme: ' + theme);
}

const themeMenu = document.getElementById('theme-menu');
const themeIcon = document.getElementById('theme-icon');

themeMenu.value = theme;

themeMenu.addEventListener('change', function (event) {
    const value = event.target.value;
    if (value == undefined) {
        return;
    }

    mdui.setTheme(value);

    docCookies.setItem(name = 'theme', value, end = Infinity, domain = window.location.host);
    console.log('Save cookies');

    if (value == 'auto') {
        let theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        themeIcon.setAttribute('icon', theme + '_mode');
        return;
    }

    themeIcon.setAttribute('icon', value + '_mode');
});