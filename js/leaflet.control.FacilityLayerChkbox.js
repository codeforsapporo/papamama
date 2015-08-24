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
        placeholder: 'change layer...',
    },
    initialize: function (options) {
        // constructor
        L.setOptions(this, options);
    },
    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar  layer-change');

        // コントロールクリック時、地図クリックイベント発生を防ぐ
        L.DomEvent.disableClickPropagation(container);

        for(var key in this.options.layers) {
            // チェックボックス要素を生成
            input = document.createElement('input');
            input.type = 'checkbox';
            input.className = 'leaflet-control-layers-selector';
            input.defaultChecked = this.options.checkStatus[key];
            input.id = 'layerControl-' + key;
            L.DomEvent.on(input, 'click', this._onInputClick, this);

            // 名称の表示
            var name = document.createElement('span');
            name.innerHTML = ' ' + key;

            // ラベルタグを用意
            var label = document.createElement('label');
            label.appendChild(input);
            label.appendChild(name);
            container.appendChild(label);
        }

        return container;
    },
    onRemove: function (map) {
        // when removed
    },
    _onInputClick: function(evt) {
        var targetId = evt.toElement.id;
        var idx = targetId.split('-')[1];
        var targetInput = document.getElementById(targetId);
        var targetLayer = this.options.layers[idx];
        if(targetInput.checked) {
            this._map.addLayer(targetLayer);
        } else {
            this._map.removeLayer(targetLayer);
        }
        this._refocusOnMap();
    }
});

L.control.facilityLayerChkbox = function(options) {
    return new L.Control.FacilityLayerChkbox(options);
};
