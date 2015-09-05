/**
 * leaflet.MoveToStationList
 * 駅移動用セレクトボックスを地図上に表示する leaflet.js 用カスタムコントロール
 *
 * (c) 2015 Yusuke Suzuki.
 */
L.Control.MoveToStationList = L.Control.extend({
    options: {
        // topright, topleft, bottomleft, bottomright
        position: 'topleft',
        placeholder: 'move to...',
    },
    initialize: function (options) {
        // constructor
        L.setOptions(this, options);
        this.moveToList = {}; // 移動先を格納
        this.stationMarker = null;
    },
    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar  layer-change moveTo-container');

        // コントロールクリック時、地図クリックイベント発生を防ぐ
        L.DomEvent.disableClickPropagation(container);

        // クラス名を定義
        var className = "leaflet-control-facility-layer-chkbox";
        this._form = L.DomUtil.create('form', className + '-list');
        var form = this._form;

        var select = document.createElement('select');
        select.id = 'moveTo';

        var option = document.createElement('option');
        option.value = "";
        select.appendChild(option);
        form.appendChild(select);

        L.DomEvent.on(select, 'change', this._moveToFunc, this);

        container.appendChild(form);
        return container;
    },
    onRemove: function (map) {
        // when removed
    },
    _moveToFunc: function() {
        // 選択ボックスの選択時に実行される地図移動処理
        var select = this._form.firstChild;
        var selectedOption = select.options[select.selectedIndex];
        var line = selectedOption.line;
        var lineIdx = selectedOption.lineIdx;
        if(this.moveToList[line][lineIdx]) {
            var moveToObj = this.moveToList[line][lineIdx];
            var moveLatlng = L.latLng(moveToObj.lat, moveToObj.lon);

            // レイヤーに描画した情報を削除
            if(this._map.hasLayer(this.stationMarker)) {
                this._map.removeLayer(this.stationMarker);
            }

            // マーカーを追加
            this.stationMarker = L.marker(moveLatlng, {title: selectedOption.innerHTML});
            var popupContent = selectedOption.line + ':' + selectedOption.innerHTML;
            this.stationMarker.bindPopup(popupContent);
            this.stationMarker.addTo(this._map);
            this.stationMarker.togglePopup();

            this._map.panTo(moveLatlng, {animate: true});
        }
    },
    // 駅情報からセレクトボックスにデータを追加する。
    addMoveToList: function(stationJson) {
        // L.geoJson.addData の処理を参考
        var features = L.Util.isArray(stationJson) ? stationJson : stationJson.features;
        if (features) {
            for (i = 0, len = features.length; i < len; i++) {
                feature = features[i];
                if (feature.geometries || feature.geometry || feature.features || feature.coordinates) {
                    // 再帰呼び出し
                    this.addMoveToList(features[i]);
                }
            }
            return this;
        }

        // 以降、features が undefined である場合に実行される駅データ設定処理
        var feature = stationJson;
        var key = feature.properties['shubetsu'] + ' ' + feature.properties['line'];
        if(this.moveToList[key] === undefined) {
            this.moveToList[key] = [];
        }
        this.moveToList[key].push(feature.properties);
    },
    createForm: function() {
        console.log(this.moveToList);

        var select = this._form.firstChild;
        var optionGroup = null;
        var option = null;
        for(var lineName in this.moveToList) {
            console.log(lineName);
            optionGroup = document.createElement('optgroup');
            optionGroup.label = lineName;
            for(var i = 0; i < this.moveToList[lineName].length; i++) {
                option = document.createElement('option');
                option.value     = this.moveToList[lineName][i].station_name;
                option.innerHTML = this.moveToList[lineName][i].station_name;
                option.line = lineName;
                option.lineIdx = i;
                optionGroup.appendChild(option);
            }
            select.appendChild(optionGroup);
        }
    }
});

L.control.moveToStationList = function(options) {
    return new L.Control.MoveToStationList(options);
};
