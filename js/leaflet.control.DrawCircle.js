/**
 * L.Control.DrawCircle
 *
 *
 * (c) 2015 Code for Sapporo.
 */
L.Control.DrawCircle = L.Control.extend({
    options: {
        // topright, topleft, bottomleft, bottomright
        position: 'topleft',
        placeholder: 'about code for Sapporo.',
    },
    initialize: function (options) {
        // constructor
        L.setOptions(this, options);
        this._layer = {};
    },
    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar  layer-change');

        // コントロールクリック時、地図クリックイベント発生を防ぐ
        L.DomEvent.disableClickPropagation(container);

        this._form = L.DomUtil.create('form', 'drawCircle');
        var form = this._form;

        var meterList = {
            0: "円消去",
            500: "半径500m",
            1000: "半径1km",
            3000: "半径3km",
            5000: "半径5km"
        };
        var select = document.createElement('select');
        L.DomEvent.on(select, 'change', this._moveToFunc, this);

        for(var key in meterList) {
            var option = document.createElement('option');
            option.value = key;
            option.innerHTML = meterList[key];
            select.appendChild(option);
        }
        form.appendChild(select);
        container.appendChild(form);

        return container;
    },
    onRemove: function (map) {
        // when removed
    },
    _moveToFunc: function() {
        var select = this._form.firstChild;
        var selectedOption = select.options[select.selectedIndex];

        this._map.removeLayer(this._layer);
        if(selectedOption.value != "0") {
            var mapCenter = this._map.getCenter();
            var circle1 = L.circle(mapCenter, selectedOption.value);
            var circle2 = L.circle(mapCenter, 50);
            this._layer = L.layerGroup([circle1, circle2]);
            this._map.addLayer(this._layer);

            // 円の大きさに合わせて地図の縮尺を変更
            var bounds = circle1.getBounds();
            var zoom = this._map.getBoundsZoom(bounds, false);
            this._map.setZoom(zoom);
            console.log('zoom', bounds, zoom);
        }
    }
});

L.control.drawCircle = function(options) {
    return new L.Control.DrawCircle(options);
};

