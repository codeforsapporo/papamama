/**
 * コンストラクタ
 *
 * @param ol.Map map OpenLayers3 map object
 *
 */
window.Papamamap = function() {
    this.map = null;
    this.centerLatOffsetPixel = 75;
    this.viewCenter = [];
};

/**
 * マップを作成して保持する
 *
 * @param  {[type]} mapServerListItem [description]
 * @return {[type]}                   [description]
 */
Papamamap.prototype.generate = function(mapServerListItem)
{
    this.map = new ol.Map({
        layers: [
            new ol.layer.Tile({
                opacity: 1.0,
                name: 'layerTile',
                source: mapServerListItem.source
            }),
            // 中学校区レイヤーグループ
            new ol.layer.Group({
                layers:[
                    // 中学校区ポリゴン
                    new ol.layer.Vector({
                        source: new ol.source.GeoJSON({
                            projection: 'EPSG:3857',
                            url: 'data/MiddleSchool.geojson'
                        }),
                        name: 'layerMiddleSchool',
                        style: middleSchoolStyleFunction,
                    }),
                    // 中学校区位置
                    new ol.layer.Vector({
                        source: new ol.source.GeoJSON({
                            projection: 'EPSG:3857',
                            url: 'data/MiddleSchool_loc.geojson'
                        }),
                        name: 'layerMiddleSchoolLoc',
                        style: middleSchoolStyleFunction,
                    }),
                ],
                visible: false
            }),
            // 小学校区レイヤーグループ
            new ol.layer.Group({
                layers:[
                     // 小学校区ポリゴン
                     new ol.layer.Vector({
                         source: new ol.source.GeoJSON({
                             projection: 'EPSG:3857',
                             url: 'data/Elementary.geojson'
                         }),
                         name: 'layerElementarySchool',
                         style: elementaryStyleFunction,
                     }),
                     // 小学校区位置
                     new ol.layer.Vector({
                         source: new ol.source.GeoJSON({
                             projection: 'EPSG:3857',
                             url: 'data/Elementary_loc.geojson'
                         }),
                         name: 'layerElementarySchoolLoc',
                         style: elementaryStyleFunction,
                     })
                ],
                visible: false
            }),
            // 距離同心円描画用レイヤー
            new ol.layer.Vector({
                 source: new ol.source.Vector(),
                 name: 'layerCircle',
                 style: circleStyleFunction,
                 visible: true
            }),
        ],
        target: 'map',
        view: new ol.View({
            center: ol.proj.transform(this.viewCenter, 'EPSG:4326', 'EPSG:3857'),
            zoom: 14,
            maxZoom: 18,
            minZoom: 10
        }),
        controls: [
             new ol.control.Attribution({collapsible: true}),
             new ol.control.ScaleLine({}), // 距離ライン定義
             new ol.control.Zoom({}),
             new ol.control.ZoomSlider({}),
             new MoveCurrentLocationControl()
        ]
    });
};

/**
 * 指定した名称のレイヤーの表示・非表示を切り替える
 * @param  {[type]} layerName [description]
 * @param  {[type]} visible   [description]
 * @return {[type]}           [description]
 */
Papamamap.prototype.switchLayer = function(layerName, visible)
{
    this.map.getLayers().forEach(function(layer) {
        if (layer.get('name') == layerName) {
            layer.setVisible(visible);
        }
    });
};

/**
 * 指定した座標にアニメーションしながら移動する
 * isTransform:
 * 座標参照系が変換済みの値を使うには false,
 * 変換前の値を使うには true を指定
 */
Papamamap.prototype.animatedMove = function(lon, lat, isTransform)
{
    // グローバル変数 map から view を取得する
    view = this.map.getView();
    var pan = ol.animation.pan({
        duration: 850,
        source: view.getCenter()
    });
    this.map.beforeRender(pan);
    var coordinate = [lon, lat];
    if(isTransform) {
        // 座標参照系を変換する
        coordinate = ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
    } else {
        // 座標系を変換しない
        // モバイルでポップアップ上部が隠れないように中心をずらす
        var pixel = this.map.getPixelFromCoordinate(coordinate);
        pixel[1] = pixel[1] - this.centerLatOffsetPixel;
        coordinate = this.map.getCoordinateFromPixel(pixel);
    }
    view.setCenter(coordinate);
};


/**
 * 指定したgeojsonデータを元に公立認可・私立認可・小規模等・横浜保育室・認可外・幼稚園レイヤーを描写する
 *    ※上記以外に描写レイヤーを追加する時は、下の this.map.removeLayer(this.map.getLayers().item(4)); も追加レイヤーの数だけ追加してください！
 *
 * @param {[type]} facilitiesData [description]
 */
Papamamap.prototype.addNurseryFacilitiesLayer = function(facilitiesData)
{
    if(this.map.getLayers().getLength() >= 4) {
        this.map.removeLayer(this.map.getLayers().item(4));
        this.map.removeLayer(this.map.getLayers().item(4));
        this.map.removeLayer(this.map.getLayers().item(4));
        this.map.removeLayer(this.map.getLayers().item(4));
        this.map.removeLayer(this.map.getLayers().item(4));
        this.map.removeLayer(this.map.getLayers().item(4));
    }

    // 幼稚園
    this.map.addLayer(
        new ol.layer.Vector({
            source: new ol.source.GeoJSON({
                projection: 'EPSG:3857',
                object: facilitiesData
            }),
            name: 'layerKindergarten',
            style: kindergartenStyleFunction
        })
    );
    // 認可外
    this.map.addLayer(
        new ol.layer.Vector({
            source: new ol.source.GeoJSON({
                projection: 'EPSG:3857',
                object: facilitiesData
            }),
            name: 'layerNinkagai',
            style: ninkagaiStyleFunction
        })
    );
    // 私立認可
    this.map.addLayer(
        new ol.layer.Vector({
            source: new ol.source.GeoJSON({
                projection: 'EPSG:3857',
                object: facilitiesData
            }),
            name: 'layerPriNinka',
            style: priNinkaStyleFunction
        })
    );
    // 公立認可
    this.map.addLayer(
        new ol.layer.Vector({
            source: new ol.source.GeoJSON({
                projection: 'EPSG:3857',
                object: facilitiesData
            }),
            name: 'layerPubNinka',
            style: pubNinkaStyleFunction
        })
    );
    // 横浜保育室
    this.map.addLayer(
        new ol.layer.Vector({
            source: new ol.source.GeoJSON({
                projection: 'EPSG:3857',
                object: facilitiesData
            }),
            name: 'layerYhoiku',
            style: yhoikuStyleFunction
        })
    );
    // 小規模・事業所内保育事業
    this.map.addLayer(
        new ol.layer.Vector({
            source: new ol.source.GeoJSON({
                projection: 'EPSG:3857',
                object: facilitiesData
            }),
            name: 'layerJigyosho',
            style: jigyoshoStyleFunction
        })
    );
};

/**
 * 保育施設データの読み込みを行う
 * @return {[type]} [description]
 */
Papamamap.prototype.loadNurseryFacilitiesJson = function(successFunc)
{
    var d = new $.Deferred();
    $.getJSON(
        "data/nurseryFacilities.geojson",
        function(data) {
            successFunc(data);
            d.resolve();
        }
    ).fail(function(){
        console.log('station data load failed.');
        d.reject('load error.');
    });
    return d.promise();
};

/**
 *
 * @param  {[type]} mapServerListItem [description]
 * @param  {[type]} opacity           [description]
 * @return {[type]}                   [description]
 */
Papamamap.prototype.changeMapServer = function(mapServerListItem, opacity)
{
    this.map.removeLayer(this.map.getLayers().item(0));
    source_type = mapServerListItem.source_type;
    var layer = null;
    switch(source_type) {
        case 'image':
            layer = new ol.layer.Image({
                opacity: opacity,
                source: mapServerListItem.source
            });
            break;
        default:
            layer = new ol.layer.Tile({
                opacity: opacity,
                source: mapServerListItem.source
            });
            break;
    }
    this.map.getLayers().insertAt(0, layer);
};

/**
 * 指定した名前のレイヤー情報を取得する
 * @param  {[type]} layerName [description]
 * @return {[type]}           [description]
 */
Papamamap.prototype.getLayer = function(layerName)
{
    result = null;
    this.map.getLayers().forEach(function(layer) {
        if (layer.get('name') == layerName) {
            result = layer;
        }
    });
    return result;
};

/**
 * 指定した場所に地図の中心を移動する。
 * 指定した場所情報にポリゴンの座標情報を含む場合、ポリゴン外枠に合わせて地図の大きさを変更する
 *
 * @param  {[type]} mapServerListItem [description]
 * @return {[type]}                   [description]
 */
Papamamap.prototype.moveToSelectItem = function(mapServerListItem)
{
    if(mapServerListItem.coordinates !== undefined) {
        // 区の境界線に合わせて画面表示
        components = [];
        for(var i=0; i<mapServerListItem.coordinates.length; i++) {
            coord = mapServerListItem.coordinates[i];
            pt2coo = ol.proj.transform(coord, 'EPSG:4326', 'EPSG:3857');
            components.push(pt2coo);
        }
        components = [components];

        view = this.map.getView();
        polygon = new ol.geom.Polygon(components);
        size =  this.map.getSize();
        var pan = ol.animation.pan({
            duration: 850,
            source: view.getCenter()
        });
        this.map.beforeRender(pan);

        feature = new ol.Feature({
            name: mapServerListItem.name,
            geometry: polygon
        });
        layer = this.getLayer(this.getLayerName("Circle"));
        source = layer.getSource();
        source.clear();
        source.addFeature(feature);

        view.fitGeometry(
            polygon,
            size,
            {
                constrainResolution: false
            }
        );
    } else {
        // 選択座標に移動
        lon = mapServerListItem.lon;
        lat = mapServerListItem.lat;
        if(lon !== undefined && lat !== undefined) {
            this.animatedMove(lon, lat, true);
        }
    }
};

/**
 * [getPopupTitle description]
 * @param  {[type]} feature [description]
 * @return {[type]}         [description]
 */
Papamamap.prototype.getPopupTitle = function(feature)
{
    // タイトル部
    var title = '';
    var type = feature.get('種別') ? feature.get('種別') : feature.get('Type');
    title  = '[' + type + '] ';
    var owner = feature.get('設置') ? feature.get('設置') : feature.get('Ownership');
    if(!isUndefined(owner)) {
        title += ' [' + owner +']';
    }
    var name = feature.get('名称') ? feature.get('名称') : feature.get('Name');
    title += name;
    url = feature.get('url');
    if(!isUndefined(url)) {
        title = '<a href="' +url+ '" target="_blank">' + title + '</a>';
    }
    return title;
};

/**
 * [getPopupContent description]
 * @param  {[type]} feature [description]
 * @return {[type]}         [description]
 */
Papamamap.prototype.getPopupContent = function(feature)
{
    var content = '';
    content = '<table><tbody>';
    var open  = feature.get('開園時間') ? feature.get('開園時間') : feature.get('Open');
    var close = feature.get('終園時間') ? feature.get('終園時間') : feature.get('Close');
    if (!isUndefined(open) && !isUndefined(close)) {
        content += '<tr>';
        content += '<th>時間</th>';
        content += '<td>';
        content += open + '〜' + close;
        content += '</td>';
        content += '</tr>';
    }
    var memo = feature.get('備考') ? feature.get('備考') : feature.get('Memo');
    if (!isUndefined(memo)) {
        content += '<tr>';
        content += '<th></th>';
        content += '<td>' + memo + '</td>';
        content += '</tr>';
    }
    var temp    = feature.get('一時') ? feature.get('一時') : feature.get('Temp');
    var holiday = feature.get('休日') ? feature.get('休日') : feature.get('Holiday');
    var night   = feature.get('夜間') ? feature.get('夜間') : feature.get('Night');
    var h24     = feature.get('H24') ? feature.get('H24') : feature.get('H24');

    if( !isUndefined(temp) || !isUndefined(holiday) || !isUndefined(night) || !isUndefined(h24)) {
        content += '<tr>';
        content += '<th></th>';
        content += '<td>';
        if (formatNull(temp) !== null) {
            content += '一時保育 ';
        }
        if (formatNull(holiday) !== null) {
            content += '休日保育 ';
        }
        if (formatNull(night) !== null) {
            content += '夜間保育 ';
        }
        if (formatNull(h24) !== null) {
            content += '24時間 ';
        }
        content += '</td>';
        content += '</tr>';
    }

    var type = feature.get('種別') ? feature.get('種別') : feature.get('Type');
    if(type == "私立認可保育所") {
        content += '<tr>';
        content += '<th>欠員</th>';
        content += '<td>';
        var vacancy = feature.get('Vacancy') ? feature.get('Vacancy') : feature.get('Vacancy');
        if (!isUndefined(vacancy)) {
            content += '<a href="http://www.city.yokohama.lg.jp/kohoku/sabisu/hoiku/" target="_blank">空き情報</a>';
        }
        var vacancyDate = feature.get('VacancyDate');
        if (!isUndefined(vacancyDate)) {
            content += " (" + vacancyDate + ")";
        }
        content += '</td>';
        content += '</tr>';
    }
    var ageS = feature.get('開始年齢') ? feature.get('開始年齢') : feature.get('AgeS');
    var ageE = feature.get('終了年齢') ? feature.get('終了年齢') : feature.get('AgeE');
    if (!isUndefined(ageS) && !isUndefined(ageE)) {
        content += '<tr>';
        content += '<th>年齢</th>';
        content += '<td>' + ageS + '〜' + ageE + '</td>';
        content += '</tr>';
    }
    var full = feature.get('定員') ? feature.get('定員') : feature.get('Full');
    if (!isUndefined(full)) {
        content += '<tr>';
        content += '<th>定員</th>';
        content += '<td>' + full + '人</td>';
        content += '</tr>';
    }
    var tel = feature.get('TEL') ? feature.get('TEL') : feature.get('TEL');
    if (!isUndefined(tel)) {
        content += '<tr>';
        content += '<th>TEL</th>';
        content += '<td>' + tel + '</td>';
        content += '</tr>';
    }
    var add1 = feature.get('住所１') ? feature.get('住所１') : feature.get('Add1');
    var add2 = feature.get('住所２') ? feature.get('住所２') : feature.get('Add2');
    if (!isUndefined(add1) || !isUndefined(add2)) {
        content += '<tr>';
        content += '<th>住所</th>';
        content += '<td>' + add1 + add2 +'</td>';
        content += '</tr>';
    }
    var owner = feature.get('設置者') ? feature.get('設置者') : feature.get('Owner');
    if (!isUndefined(owner)) {
        content += '<tr>';
        content += '<th>設置者</th>';
        content += '<td>' + owner + '</td>';
        content += '</tr>';
    }
    content += '</tbody></table>';
    return content;
};

/**
* 空文字判定関数
* 　引数が未定義、null、空文字いずれかの場合はnullを返却する
* 　それ以外の時はparamを返却する
* @param {[type]}
* @return {[type]}
**/
function formatNull(param){
  if(param == null || param == undefined || param ==""){
    return null;
  } else {
    return param;
  }
}

/**
* 未定義カラム判定関数
* 　引数が未定義、null、空文字いずれかの場合はtrueを返却する
* @param {[type]}
* @return {[type]}
**/
function isUndefined(param){
  if(param == null || param == undefined || param ==""){
    return true;
  } else {
    return false;
  }
}

/**
 * 円を消す
 *
 * @param  {[type]} radius      [description]
 * @param  {[type]} moveToPixel [description]
 * @return {[type]}             [description]
 */
Papamamap.prototype.clearCenterCircle = function()
{
    var layer = this.getLayer(this.getLayerName("Circle"));
    var source = layer.getSource();
    source.clear();
};

/**
 * 円を描画する
 *
 * @param  {[type]} radius      [description]
 * @param  {[type]} moveToPixel [description]
 * @return {[type]}             [description]
 */
Papamamap.prototype.drawCenterCircle = function(radius, moveToPixel)
{
    if(moveToPixel === undefined || moveToPixel === null) {
        moveToPixel = 0;
    }
    if(radius === "") {
        radius = 500;
    }

    // 円を消す
    this.clearCenterCircle();

    view  = this.map.getView();
    coordinate = view.getCenter();
    if(moveToPixel > 0) {
        var pixel = map.getPixelFromCoordinate(coordinate);
        pixel[1] = pixel[1] + moveToPixel;
        coordinate = map.getCoordinateFromPixel(pixel);
    }
    // circleFeatures = drawConcentricCircle(coord, radius);

    // 選択した半径の同心円を描く
    radius = Math.floor(radius);

    circleFeatures = [];
    // 中心部の円を描く
    var sphere = new ol.Sphere(6378137); // ol.Sphere.WGS84 ol.js には含まれてない
    coordinate = ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326');

    // 描画する円からextent情報を取得し、円の大きさに合わせ画面の縮尺率を変更
    geoCircle = ol.geom.Polygon.circular(sphere, coordinate, radius);
    geoCircle.transform('EPSG:4326', 'EPSG:3857');
    circleFeature = new ol.Feature({
        geometry: geoCircle
    });
    circleFeatures.push(circleFeature);

    // 大きい円に合わせて extent を設定
    extent = geoCircle.getExtent();
    view   = this.map.getView();
    sizes  = this.map.getSize();
    size   = (sizes[0] < sizes[1]) ? sizes[0] : sizes[1];
    view.fitExtent(extent, [size, size]);

    // 円の内部に施設が含まれるかチェック
    _features = nurseryFacilities.features.filter(function(item,idx){
        coordinate = ol.proj.transform(item.geometry.coordinates, 'EPSG:4326', 'EPSG:3857');
        if(ol.extent.containsCoordinate(extent, coordinate))
            return true;
        });
    for(var i=0; i < _features.length; i++) {
        console.log(_features[i].properties['名称']);
    }
    console.log(_features);

    var layer  = this.getLayer(this.getLayerName("Circle"));
    var source = layer.getSource();
    source.addFeatures(circleFeatures);
    return;
};

/**
 * レイヤー名を取得する
 * @param  {[type]} cbName [description]
 * @return {[type]}        [description]
 */
Papamamap.prototype.getLayerName = function(cbName)
{
    return 'layer' + cbName;
};

/**
 * 指定した名称のレイヤーの表示・非表示を切り替える
 * @param  {[type]} layerName [description]
 * @param  {[type]} visible   [description]
 * @return {[type]}           [description]
 */
Papamamap.prototype.switchLayer = function(layerName, visible) {
    var _layerName = this.getLayerName(layerName.substr(2));
    this.map.getLayers().forEach(function(layer) {
        if (layer.get('name') == _layerName) {
            layer.setVisible(visible);
        }
    });
};
