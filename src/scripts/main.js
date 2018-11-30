/* console.log("Main");

var id = 2;

var typed = new Typed('#landing-text', {
    strings: [
        "Todo el agua dulce del Perú proviene de glaciares y lluvias cada vez más escasos.",
        "El agua discurre por ríos, lagunas y acuíferos que confluyen y drenan su contenido en 159 cuencas, antes de perderse en el mar.",
        "En algunas cuencas, donde conviven la agricultura y la minería, el agua es escasa y se desarrollan conflictos sociales."
    ],
    typeSpeed: 30,
    backDelay: 1500,
    onStringTyped: function () {
        if (id == 1) {
            $(".btn-go").css('opacity', 1);
            $("#bg2").css("transition", "opacity 1.25s ease 0s");
            $("#bg2").css("filter", "blur(5px)");
            // $(".cover").css("background-color", "rgba(17, 17, 17, 0.85);")
        } else {
            setTimeout(function () {
                $("#bg" + id).css('opacity', 0);
                $("#bg" + (id + 1) % 3).css('opacity', 1);
            }, 1750);

            id = (id + 1) % 3;
        }
    }
}); */