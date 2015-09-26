/**
 * L.Control.SearchFilter
 *

 * (c) 2015 Code for Sapporo.
 */
L.Control.SearchFilter = L.Control.extend({
    options: {
        // topright, topleft, bottomleft, bottomright
        position: 'topleft',
        placeholder: 'about code for Sapporo.',
    },
    initialize: function (options) {
        // constructor
        L.setOptions(this, options);
    },
    onAdd: function (map) {
        var container = L.DomUtil.create(
            'div', 'leaflet-control-locate leaflet-bar leaflet-control about-cfs');

        // コントロールクリック時、地図クリックイベント発生を防ぐ
        L.DomEvent.disableClickPropagation(container);

        L.DomEvent.on(container, 'click', this.options.callback, this);

        contents  = '<div id="nav">';
        contents += '<span class="fa fa-filter"></span>';
        contents += '</div>';

        container.innerHTML = contents;
        return container;
    },

});

L.control.searchFilter = function(options) {
    return new L.Control.SearchFilter(options);
};
