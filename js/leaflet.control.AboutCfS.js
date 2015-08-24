/**
 * L.Control.aboutCfS
 * Code for Sapporo について
 *
 * (c) 2015 Code for Sapporo.
 */
L.Control.AboutCfS = L.Control.extend({
    options: {
        // topright, topleft, bottomleft, bottomright
        position: 'bottomright',
        placeholder: 'about code for Sapporo.',
    },
    initialize: function (options) {
        // constructor
        L.setOptions(this, options);
    },
    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-control-locate leaflet-bar leaflet-control about-cfs');

        // コントロールクリック時、地図クリックイベント発生を防ぐ
        L.DomEvent.disableClickPropagation(container);

        L.DomEvent.on(container, 'click', this._onInputClick, this);

        container.innerHTML = '<span class="fa fa-question-circle"></span>';
        return container;
    },
    _onInputClick: function() {
        var content = '';
        content += '<h2>さっぽろ保育園マップ</h2>';
        content += '<p>';
        content += 'v2.0 (rev.20150830)';
        content += '</p>';
        content += '<p>';
        content += '<a href="http://www.codeforsapporo.org/papamama/" target="_blank">詳しくはこちら</a>';
        content += '</p>';
        content += '<p>';
        content += '(C) 2014, 2015 <a href="http://www.codeforsapporo.org/" target="_blank">Code for Sapporo.</a>';
        content += '</p>';

        this._map.openModal({
            content: content,
        });
    }
});

L.control.aboutCfS = function(options) {
    return new L.Control.AboutCfS(options);
};
