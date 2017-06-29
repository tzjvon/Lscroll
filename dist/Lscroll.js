(function (global, factory) {
    if (typeof exports === 'object' && typeof module === 'object') {
        module.exports = factory();
    }
    else if (typeof define === 'function' && define.amd) {
        define([], factory);
    }
    else {
        window.Lscroll = factory();
    }
})(this, function () {

    function noop() {

    }
    function hasClass(el, cl) {
        return el.className.match(new RegExp('(\\s|^)(' + cl + ')(\\s|$)'));
    }
    function addClass(el, cl) {
        if (!hasClass(el, cl)) {
            el.className += ' ' + cl;
        }
    }
    function removeClass(el, cl) {
        if (hasClass(el, cl)) {
            var arr = el.className.split(/\s+/);
            arr.splice( arr.indexOf(cl), 1 );
            el.className = arr.join(' ');
        }
    }
    function addEvent(el, type, fn, bubble) {
        el.addEventListener(type, fn, bubble);
    }
    function removeEvent(el, type, fn){
        el.removeEventListener(type, fn)
    }
    // function setAttributes(el, _obj) {
    //     for (var key in _obj) {
    //         el[key] = _obj[key];
    //     }
    // }

    var TRANSFORM = null;
    (function() {
        var e = document.createElement('fakeElement');
        [
            ['WebkitTransform', 'webkitTransform', 'webkit'],
            ['transform', 'Transform', null],
            ['MozTransform', 'transform', 'moz'],
            ['OTransform', 'oTransform', 'o']
        ].some(function(t) {
            if (e.style[t[0]] !== undefined) {
                TRANSFORM = t[1];
                return true;
            }
        });
    })();

    var userAgent = window.navigator.userAgent;

    var isChrome = userAgent.indexOf('Firefox') > -1 ? 0 : 1;

    var Lscroll = function (_opts) {
        function getEle(args){
            if (typeof args == 'string') {
                return document.querySelector(args);
            }else if(args && args.nodeType === 1){
                return args;
            }
        }
        this.wrapper = getEle(_opts.wrapper);
        this.slider = getEle(_opts.slider);
        this.scrollbar = getEle(_opts.scrollbar);

        if (!this.scrollbar) {
            throw new Error('No wrapper');
        }

        if (!this.scrollbar) {
            throw new Error('No scrollbar');
        }

        if (!this.slider) {
            throw new Error('No slider');
        }

        this.preWheelPixels = _opts.preWheelPixels || 20;

        this.thumb = this.scrollbar.firstElementChild;

        this.onMoving = false;

        this.startY = 0;
        this.moveY = 0;
        this.moveYLasttime = 0;

        this.wheelY = 0;

        // this.scrollbarHeight,
        // this.thumbHeight,
        // this.thumbMovableMaxDist,
        // this.sliderHeight,
        // this.sliderMovableMaxDist,
        // this.scale;

        this.timeout = null;

        this.wrapperHeight = this.wrapper.offsetHeight;

        this.scrollbarHide = !!_opts.scrollbarHide;

        if (this.scrollbarHide) {
            this._showScrollbar = function () {
                window.clearTimeout(this.timeout);
                addClass(this.scrollbar, 'active');
                var self = this;
                this.timeout = setTimeout(function () {
                    removeClass(self.scrollbar, 'active');
                }, 1000);
            };
        }else {
            this._showScrollbar = noop;

            this.scrollbar.style.opacity = '1';
            this.scrollbar.style.visibility = 'visible';
        }


        this._init();
        this._bindEvent();

    };

    var VonFn = Lscroll.prototype;

    VonFn._init = VonFn.init = function () {

        this.sliderHeight = this.slider.offsetHeight;
        this.wrapperHeight = this.wrapper.offsetHeight;

        this.sliderMovableMaxDist = this.sliderHeight - this.wrapperHeight;

        this.sliderHeight = this.slider.offsetHeight <= 0 ? 1 : this.slider.offsetHeight;

        this.scrollbarHeight = this.scrollbar.offsetHeight;


        this.scale = this.scrollbarHeight / this.sliderHeight;

        if (this.scale >= 1) {
            this.thumb.style.height = '100%';
        }else {
            this.thumb.style.height = (this.wrapperHeight / this.sliderHeight) * this.scrollbarHeight + 'px';
        }

        this.thumbHeight = this.thumb.offsetHeight;
        this.thumbMovableMaxDist = this.scrollbarHeight - this.thumbHeight;



        this._showScrollbar();
    };

    VonFn.handleEvent = function (e) {
        var evt = e || window.event;

        switch (evt.type) {
            case 'mousedown':
                this._startHandler(evt);
                break;
            case 'mousemove':
                this._moveHandler(evt);
                break;
            case 'mouseover':
                this._overHandler(evt);
                break;
            case 'mouseout':
                this._outHandler(evt);
                break;
            case 'DOMMouseScroll':
            case 'mousewheel':
                this._wheelHandler(evt);
                break;
            case 'mouseup':
            case 'touchcancel':
                this._endHandle(evt);
                break;

        }
    };

    VonFn._bindEvent = function () {
        addEvent(this.thumb, 'mousedown', this, false);
        addEvent(this.thumb, 'mousemove', this, false);
        addEvent(this.thumb, 'mouseup', this, false);
        addEvent(document.body, 'mouseup', this, false);
        addEvent(document.body, 'mousemove', this, false);
        addEvent(this.scrollbar, 'mouseover', this, false);
        addEvent(this.scrollbar, 'mouseout', this, false);

        if (isChrome) {
            addEvent(this.wrapper, 'mousewheel', this, false);
        }else {
            addEvent(this.wrapper, 'DOMMouseScroll', this, false);
        }
    };

    VonFn.destroy = function (){
        removeEvent(this.thumb, 'mousedown', this);
        removeEvent(this.thumb, 'mousemove', this);
        removeEvent(this.thumb, 'mouseup', this);
        removeEvent(document.body, 'mouseup', this);
        removeEvent(document.body, 'mousemove', this);
        removeEvent(this.scrollbar, 'mouseover', this);
        removeEvent(this.scrollbar, 'mouseout', this);

        if (isChrome) {
            removeEvent(this.wrapper, 'mousewheel', this);
        }else {
            removeEvent(this.wrapper, 'DOMMouseScroll', this);
        }
    };

    VonFn._startHandler = function (e) {
        e.stopPropagation();
        this.onMoving = true;
        this.startY = e.pageY;
    };

    VonFn._moveHandler = function (e) {
        e.stopPropagation();

        if (this.scale >= 1) {
            return ;
        }

        if (!this.onMoving) {
            return false;
        }

        this.moveY = e.pageY - this.startY;
        this.moveY += this.moveYLasttime;
        this.moveY = this.moveY < 0 ? 0 : this.moveY > this.thumbMovableMaxDist ? this.thumbMovableMaxDist : this.moveY;

        this.thumb.style[TRANSFORM] = 'translate3d(0, ' + this.moveY + 'px, 0)';

        this.wheelY = -(this.moveY / this.scale);
        this.slider.style[TRANSFORM] = 'translate3d(0, ' + this.wheelY + 'px, 0)';

        this._showScrollbar();

    };

    VonFn._endHandle = function (e) {
        e.stopPropagation();

        this.moveYLasttime = this.moveY;
        this.onMoving = false;
    };

    VonFn._overHandler = function (e) {
        window.clearTimeout(this.timeout);
        addClass(this.scrollbar, 'active');
    };

    VonFn._outHandler = function (e) {
        this._showScrollbar();
    };

    VonFn._processWheelData = function (_num) {
        var preNum;
        if (Math.abs(_num) >= 120) {
            preNum = _num / 120;
        }else {
            preNum = -_num;
        }

        return preNum * this.preWheelPixels;
    };

    VonFn._wheelHandler = function (e) {

        e.preventDefault();
        if (this.scale >= 1) {
            return ;
        }

        var delta = isChrome > 0 ? e.wheelDelta : e.detail;

        this.wheelY += this._processWheelData(delta);
        this.wheelY = -this.wheelY <= 0 ? 0 : -this.wheelY >= this.sliderMovableMaxDist ? -this.sliderMovableMaxDist : this.wheelY;

        this.slider.style[TRANSFORM] = 'translate3d(0, ' + this.wheelY + 'px, 0)';

        this.moveYLasttime = -(this.wheelY * this.scale);
        this.thumb.style[TRANSFORM] = 'translate3d(0, ' + this.moveYLasttime + 'px, 0)';

        this._showScrollbar();
    };

    VonFn.scrollTo = function (_y) {
        this.wheelY = -_y;
        this.wheelY = -this.wheelY <= 0 ? 0 : -this.wheelY >= this.sliderMovableMaxDist ? -this.sliderMovableMaxDist : this.wheelY;

        this.slider.style[TRANSFORM] = 'translate3d(0, ' + this.wheelY + 'px, 0)';

        this.moveYLasttime = -(this.wheelY * this.scale);
        this.thumb.style[TRANSFORM] = 'translate3d(0, ' + this.moveYLasttime + 'px, 0)';

        this._showScrollbar();
    };

    VonFn.scrollToBottom = function () {
        this.scrollTo(this.sliderMovableMaxDist);
    };

    VonFn.scrollToTop = function () {
        this.scrollTo(0);
    };


    return Lscroll;
});



