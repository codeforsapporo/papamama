/**
 * L.Control.FacilityLayerChkbox
 * 施設種別切り替え用チェックボックスを地図上に表示する
 *
 * (c) 2015 Code for Sapporo.
 */
L.Control.FacilityLayerChkbox = L.Control.extend({
    options: {
        // topright, topleft, bottomleft, bottomright
        position: 'topright',
        placeholder: 'change layer...'
    },
    initialize: function (options) {
        // constructor
        L.setOptions(this, options);
        this._layers = {};
        this._handlingClick = false;
    },
    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar  layer-change');

        // コントロールクリック時、地図クリックイベント発生を防ぐ
        L.DomEvent.disableClickPropagation(container);

        // クラス名を定義
        var className = "leaflet-control-facility-layer-chkbox";
        this._form = L.DomUtil.create('form', className + '-list');
        var form = this._form;
        if (this.options.collapsed) {
            if (!L.Browser.android) {
                L.DomEvent
                    .on(container, 'mouseover', this._expand, this)
                    .on(container, 'mouseout', this._collapse, this);
            }
            var link = this._layersLink = L.DomUtil.create('a', className + '-toggle', container);
            link.href = '#';
            link.title = 'Layers';

            if (L.Browser.touch) {
                L.DomEvent
                    .on(link, 'click', L.DomEvent.stop)
                    .on(link, 'click', this._expand, this);
            }
            else {
                L.DomEvent.on(link, 'focus', this._expand, this);
            }
            //Work around for Firefox android issue https://github.com/Leaflet/Leaflet/issues/2033
            L.DomEvent.on(form, 'click', function () {
                setTimeout(L.bind(this._onInputClick, this), 0);
            }, this);

            this._map.on('click', this._collapse, this);
            // TODO keyboard accessibility
        } else {
            this._expand();
        }

        for(var key in this.options.layers) {
            // チェックボックス要素を生成
            input = document.createElement('input');
            input.type = 'checkbox';
            input.className = className;
            input.defaultChecked = this._map.hasLayer(this.options.layers[key]);
            input.layerId = L.stamp(this.options.layers[key]);

            this._layers[input.layerId] = {
                layer: this.options.layers[key],
                name: input.layerId
            };

            L.DomEvent.on(input, 'click', this._onInputClick, this);

            // 名称の表示
            var name = document.createElement('span');
            name.innerHTML = ' ' + key;

            // ラベルタグを用意
            var label = document.createElement('label');
            label.appendChild(input);
            label.appendChild(name);

            // formに追加
            form.appendChild(label);
            var br = document.createElement('br');
            form.appendChild(br);
        }
        container.appendChild(form);

        return container;
    },
    onRemove: function (map) {
        // when removed
    },
    _onInputClick: function() {
        var obj = null;
        var inputs = this._form.getElementsByTagName('input');
        var inputsLen = inputs.length;

        for (i = 0; i < inputsLen; i++) {
            input = inputs[i];
            obj = this._layers[input.layerId];
            if (input.checked && !this._map.hasLayer(obj.layer)) {
                this._map.addLayer(obj.layer);
            } else if (!input.checked && this._map.hasLayer(obj.layer)) {
                this._map.removeLayer(obj.layer);
            }
        }
        this._handlingClick = false;
        this._refocusOnMap();

    },
    _expand: function () {
        L.DomUtil.addClass(this._container, 'leaflet-control-layers-expanded');
    },
    _collapse: function () {
        this._container.className = this._container.className.replace(' leaflet-control-layers-expanded', '');
    }
});

L.control.facilityLayerChkbox = function(options) {
    return new L.Control.FacilityLayerChkbox(options);
};
