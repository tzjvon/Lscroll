(function (global, factory) {
    if (typeof module === 'object' && typeof exports === 'object') {
        factory(require('../Lscroll'));
    }else if (typeof defined != 'undefined' && defined.amd) {
        defined(['../Lscroll'], function (Lscroll) {
            factory(Lscroll);
        });
    }else {
        factory(global['Lscroll']);
    }
})(window ? window : this, function (Lscroll) {

    Lscroll && Lscroll.regPlugin('test', function () {
        var i = 1;

        this.on('scroll', function () {
            console.log(this.wheelY);

            if (i++ > 20) {
                this.off('scroll');
            }
        })
    })


});