/**
 * 現在地に移動するためのカスタムコントロールを定義
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object=} opt_options Control options.
 */
window.MoveCurrentLocationControl = function(opt_options) {
    var options = opt_options || {};

    var element = document.createElement('div');
    element.id  = 'moveCurrentLocation';
    element.className = 'move-current-location ol-control ui-icon-navigation ui-btn-icon-notext';

    ol.control.Control.call(this, {
        element: element,
        target: options.target
    });
};
ol.inherits(MoveCurrentLocationControl, ol.control.Control);

/**
 * 現在位置を取得し、指定した関数に情報を引き渡して実行する
 *
 * @param  function successFunc 現在位置の取得に成功時に実行する関数
 * @param  function failFunc    現在位置の取得に失敗した時に実行する関数
 */
MoveCurrentLocationControl.prototype.getCurrentPosition = function(successFunc, failFunc)
{
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(successFunc, failFunc);
    } else {
        failFunc();
    }
};
