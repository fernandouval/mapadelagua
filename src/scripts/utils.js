// FB Counter
$(".counter").each(function () {
    var e = $(this),
        url = e.attr('url'),
        ACCESS_TOKEN = "1501553810140130|FZfZzc8CSIWFR-rPJUCWJnG4cdE",
        urlFB = "https://graph.facebook.com/?access_token=" + ACCESS_TOKEN + "&id=" + url;

    $.getJSON(urlFB, function (data) {
        if (data.share !== undefined) {
            var shares = data.share.share_count;
            var str = "" + shares % 1000;
            var pad = "000";
            var ans = pad.substring(0, pad.length - str.length) + str;
            shares = shares > 999 ? parseInt(shares / 1000) + "." + ans : shares;
            e.html(shares);
        }
    });
});

$('.popup').click(function (event) {
    let width = 575,
        height = 400,
        left = ($(window).width() - width) / 2,
        top = ($(window).height() - height) / 2,
        url = this.href.replace(/\#/g, '%23'),
        opts = 'status=1' +
            ',width=' + width +
            ',height=' + height +
            ',top=' + top +
            ',left=' + left;

    window.open(url, 'popup', opts);

    return false;
});