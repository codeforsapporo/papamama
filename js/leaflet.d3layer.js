/**
 * L.d3layer
 *
 * d3.js を利用して GeoJson のポリゴン情報から SVG を作成し、
 * Leaflet.js のレイヤーとして取り扱う。
 *
 * (c) 2015 Code for Sapporo.
 */
L.d3layer = L.Class.extend({
    options: {
        'fill-opacity': 0.5,
        'stroke': "blue",
        'stroke-width': "2px",
        'fill': "blue"
    },
    initialize: function (geojson, options) {
        L.setOptions(this, options);
        this._geojson = geojson;
    },
    onAdd: function (map) {
        this._map = map;

        // 表示用ポリゴン情報を格納するオブジェクト
        var obj = {
            type: "FeatureCollection",
            crs: this._geojson.crs,
            features: []
        };

        // 地図の表示範囲だけポリゴン情報を表示するように制御
        var geoShape = null;
        var mapBounds = this._map.getBounds();
        for(var i=0; i < this._geojson.features.length; i++) {
            var poly = L.polygon(this._geojson.features[i].geometry.coordinates[0]);
            for(var j=0; j < poly.getLatLngs().length; j++) {
                var featureLatLng = L.latLng(
                        poly.getLatLngs()[j].lng,
                        poly.getLatLngs()[j].lat
                    );
                if(mapBounds.contains(featureLatLng)) {
                    obj.features.push(this._geojson.features[i]);
                    break;
                }
            }
        }
        geoShape = obj;

        var svg = d3.select(this._map.getPanes().overlayPane).append("svg");
        var g = svg.append("g").attr("class", "my-custom-layer leaflet-zoom-hide");
        this._svg = svg;
        this._g = g;

        // transform Leaflet.js point to d3.js point.
        var _projectPoint = function (x, y) {
           var point = map.latLngToLayerPoint(
                new L.LatLng(y, x)
                );
            this.stream.point(point.x, point.y);
        };

        //  create a d3.geo.path to convert GeoJSON to SVG
        var transform = d3.geo.transform({point: _projectPoint});
        var path = d3.geo.path().projection(transform);
        this._path = path;

        var d3_features = g.selectAll("path")
            .data(geoShape.features)
            .enter().append("path");
        this._d3_features = d3_features;

        // add a viewreset event listener for updating layer's position, do the latter
        this._map.on('viewreset', this._reset, this);
        this._reset();
    },
    onRemove: function (map) {
        this._svg.remove();
        this._map.off('viewreset', this._reset, this);
    },
    _reset: function () {
        bounds = this._path.bounds(this._geojson);

        var topLeft = bounds[0];
        var bottomRight = bounds[1];

        this._svg.attr("width", bottomRight[0] - topLeft[0])
           .attr("height", bottomRight[1] - topLeft[1])
           .style("left", topLeft[0] + "px")
           .style("top", topLeft[1] + "px");

        this._g.attr(
            "transform", "translate("+ -topLeft[0] + "," + -topLeft[1] + ")"
            );

        // initialize the path data
        this._d3_features
            .attr("d", this._path)
            .style("fill-opacity", this.options['fill-opacity'])
            .attr('stroke', this.options['stroke'])
            .attr('stroke-width', this.options['stroke-width'])
            .attr('fill', this.options['fill']);

    },
});

L.d3Layer = function(geojson, options) {
    return new L.d3layer(geojson, options);
};
