// 地図表示時の中心座標
var init_center_coords = [43.063968, 141.347899];

// Bing APIのキー
var bing_api_key = 'AhGQykUKW2-u1PwVjLwQkSA_1rCTFESEC7bCZ0MBrnzVbVy7KBHsmLgwW_iRJg17';

// Leaflet - Bing
var bingRoadLayer = null;
if (L.BingLayer) {
    bingRoadLayer = new L.BingLayer(bing_api_key, {type: 'Road'});
}
// Leaflet - 国土地理院
var gsiLayer = L.tileLayer('http://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {
    attribution: "<a href='http://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html' target='_blank'>国土地理院</a>"
});
// Leaflet - OSM交通
var osmLayer = L.tileLayer('http://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.opencyclemap.org">OpenCycleMap</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
});
// Leaflet - Bing(写真)
var bingAerialLayer = null;
if (L.BingLayer) {
    bingAerialLayer = new L.BingLayer(bing_api_key, {type: 'Aerial'});
}
// Leaflet Google
var googleLayer = null;
if (L.Google) {
    googleLayer = new L.Google('ROADMAP');
}

// map
var map;

// 中心座標変更セレクトボックス用データ
var moveToList = {};

var facilities = [];

// 施設, 中学校マーカー, 小学校マーカーGeoJson情報を保存
var facJson, midSchoolJson, elemJson, midSchoolBgJson, elemBgJson = {};

// 施設レイヤーIDを管理
var facLayerIds = {};

// 絞込フィルター有効/無効
var enableFilter = false;

// 絞込フィルター表示/非表示
var showSearchFilter = false;

var sidebar = null;
/**
 * 初期処理
 */
$(document).ready(function(){
    resizeMapDiv();

    // 地図レイヤー一覧
    var baseMaps = {
        "Bing(標準)": bingRoadLayer,
        "国土地理院": gsiLayer,
        "交通": osmLayer,
        "写真": bingAerialLayer,
        "Google": googleLayer
    };

    // 地図生成
    map = L.map('map', {
        center: init_center_coords,
        zoom: 14,
        minZoom: 11,
        maxZoom: 17,
        layers: [bingRoadLayer],
        zoomControl: false // 地図ズームコントロールを廃止
    });

    // leaflet-hash
    hash = new L.Hash(map);

    // 駅移動セレクトボックス
    var moveToStationList = L.control.moveToStationList().addTo(map);

    // 円描画コントロール
    L.control.drawCircle().addTo(map);

    // 現在地移動
    L.control.locate().addTo(map);

    // 「Code for Sapporoについて」
    L.control.aboutCfS().addTo(map);

    // スケールコントロール
    L.control.scale().addTo(map);

    // 絞込検索
    sidebar = L.control.sidebar(
        'sidebar', {
            position: 'left',
            autoPan: false
        });

    L.control.searchFilter({
        callback: function(){
            if(showSearchFilter) {
                sidebar.hide();
                showSearchFilter = false;
            } else {
                sidebar.show();
                showSearchFilter = true;
            }
        }
    }).addTo(map);
    map.addControl(sidebar);

    // 地図ズームコントロールを右下に配置
    new L.Control.Zoom({ position: 'bottomright' }).addTo(map);

    // 施設情報読み込み
    var facilityGroup1 = L.layerGroup();
    var facilityGroup2 = L.layerGroup();
    var facilityGroup3 = L.layerGroup();
    var middleSchool   = L.layerGroup();
    var elementary     = L.layerGroup();

    // 地物保存レイヤーのIDを L.stamp を用いて取得
    facLayerIds['facilityGroup1'] = L.stamp(facilityGroup1);
    facLayerIds['facilityGroup2'] = L.stamp(facilityGroup2);
    facLayerIds['facilityGroup3'] = L.stamp(facilityGroup3);
    facLayerIds['middleSchool'] = L.stamp(middleSchool);
    facLayerIds['elementary'] = L.stamp(elementary);

    // geoJson 読み込み
    $.when(
        $.getJSON('data/nurseryFacilities.geojson'),
        $.getJSON('data/MiddleSchool.geojson'),
        $.getJSON('data/MiddleSchool_loc.geojson'),
        $.getJSON('data/Elementary.geojson'),
        $.getJSON('data/Elementary_loc.geojson'),
        $.getJSON('data/station.geojson')
    ).done(function(facilityJson, middleSchoolJson, middleSchoolLocJson, elementaryJson, elementaryLocJson, stationJson) {
        // 認可保育園、認可外保育園、幼稚園
        // 小学校、中学校マーカー
        facJson = facilityJson;
        midSchoolJson = middleSchoolLocJson;
        elemJson = elementaryLocJson;
        midSchoolBgJson = middleSchoolJson;
        elemBgJson = elementaryJson;

        // 中学校区ベクター
        var middleSchoolBg = L.d3Layer(
            midSchoolBgJson[0],
            {
                'stroke': "#7379AE",
                'fill': "#7379AE"
            });
        // ベクターとマーカーを合成したレイヤーグループを作成
        middleSchool = L.layerGroup([middleSchoolBg]);
        facLayerIds['middleSchool'] = L.stamp(middleSchool);

        // 小学校区ベクター
        var elementaryBg = L.d3Layer(
            elemBgJson[0],
            {
                'stroke': "#1BA466",
                'fill': "#1BA466"
            });
        // ベクターとマーカーを合成したレイヤーグループを作成
        elementary = L.layerGroup([elementaryBg]);
        facLayerIds['elementary'] = L.stamp(elementary);

        // 各施設レイヤーを地図に追加
        map.addLayer(facilityGroup1);

        var overlayMaps = {
            '保育園': facilityGroup1,
            '認可外': facilityGroup2,
            '幼稚園': facilityGroup3,
            '小学校区': elementary,
            '中学校区': middleSchool
        };

        // 地図上にチェックボックス
        var chkBoxOption = {
            layers: overlayMaps,
            callback: showFacilities
        };
        L.control.facilityLayerChkbox(chkBoxOption).addTo(map);

        // 駅セレクトボックスの生成
        moveToStationList.addMoveToList(stationJson);
        moveToStationList.createForm();

        // レイヤーコントロールを設定
        L.control.layers(baseMaps).addTo(map);

        // 縮尺変更後に発生させるイベントを設定
        map.on('zoomend', showMarkerLabel);

        // 地図ドラッグ後に発生させるイベントを設定
        map.on('moveend', showMarkerLabel);
        map.on('moveend', showFacilities);

        // レイヤー追加時に発生させるイベントを設定
        map.on('layeradd', showMarkerLabelForLayer);

        // 地図表示時に表示されるマーカーについてラベルの表示・非表示を決定する
        showMarkerLabel();

        // 施設情報を表示する
        showFacilities();
    });

});

/**
 * デバイス回転時、地図の大きさを画面全体に広げる
 * @return {[type]} [description]
 */
function resizeMapDiv() {
    var screenHeight = $(window).height();
    var contentCurrentHeight = $(".ui-content").outerHeight() - $(".ui-content").height();
    var contentHeight = screenHeight - contentCurrentHeight;
    var navHeight = $("#nav1").outerHeight();
    $(".ui-content").height(contentHeight);
    $("#map").height(contentHeight - navHeight);
}

/**
 * アイコン定義
 */
function pointToLayerFunc(feature, latlng) {

    var iconSize = [25, 25];
    var shadowSize = [35, 35];

    var iconUrl = '';
    var shadowUrl = '';
    if(feature.properties.Type == '認可保育所') {
        iconUrl   = 'image/019.png';
        shadowUrl = 'image/019_bg.png';
    } else if(feature.properties.Type == '認可外') {
        iconUrl  = 'image/018.png';
        shadowUrl = 'image/018_bg.png';
    } else if(feature.properties.Type == '幼稚園') {
        iconUrl  = 'image/029.png';
        shadowUrl = 'image/029_bg.png';
    }

    var facIcon = L.icon({
        iconUrl : iconUrl,
        shadowUrl: shadowUrl,
        iconSize: iconSize, // size of the icon
        shadowSize: shadowSize
    });

    // アイコン部ラベル定義
    var featureName = feature.properties.Label;
    var marker = L.marker(latlng, { icon: facIcon }).bindLabel(featureName);
    return marker;
}

/**
 * 中学校学区用
 */
function midSchoolPointToLayerFunc(feature, latlng) {
    return schoolPointToLayer(feature, latlng, 'image/middleSchool_bg.png');
}

/**
 * 中学校学区用
 */
function elementarySchoolPointToLayerFunc(feature, latlng) {
    return schoolPointToLayer(feature, latlng, 'image/elementary_bg.png');
}

/**
 * 学区共通
 */
function schoolPointToLayer(feature, latlng, shadowUrl) {
    var iconSize = [25, 25];
    var shadowSize = [35, 35];

    var iconUrl = 'image/school.png';
    var facIcon = L.icon({
        iconUrl : iconUrl,
        shadowUrl: shadowUrl,
        iconSize: iconSize, // size of the icon
        shadowSize: shadowSize
    });

    // アイコン部ラベル定義
    var featureName = feature.properties.A32_003;
    if(feature.properties.A32_003 === undefined) {
        featureName = feature.properties.A27_007;
    }
    var marker = L.marker(latlng, { icon: facIcon }).bindLabel(featureName);
    return marker;
}

/**
 * 学区用フィルター
 */
function schoolGroupFilter(feature, layer) {
    var mapBounds = map.getBounds();
    var featureLatLng = L.latLng(
        feature.geometry.coordinates[1],
        feature.geometry.coordinates[0]
        );
    // 現在の地図表示範囲にマーカーの緯度経度が含まれてれば表示
    if(mapBounds.contains(featureLatLng)) {
        return true;
    }
    return false;
}

/**
 * GeoJson読み込み時、認可保育所を絞り込むフィルター関数
 */
function facilityGroup1Filter(feature, layer) {
    var result = false;
    result = facilityGroupFilterBase(feature, layer, '認可保育所');
    if(result && enableFilter) {
        result = facilityGroup1SearchFilter(feature, layer);
    }
    return result;
}

/**
 * GeoJson読み込み時、認可外保育所を絞り込むフィルター関数
 */
function facilityGroup2Filter(feature, layer) {
    var result = false;
    result = facilityGroupFilterBase(feature, layer, '認可外');
    if(result && enableFilter) {
        result = facilityGroup2SearchFilter(feature, layer);
    }
    return result;
}

/**
 * GeoJson読み込み時、幼稚園を絞り込むフィルター関数
 */
function facilityGroup3Filter(feature, layer) {
    var result = false;
    result = facilityGroupFilterBase(feature, layer, '幼稚園');
    return result;
}

/**
 * 指定施設の絞込フィルター関数
 */
function facilityGroupFilterBase(feature, layer, matchStr) {
    var mapBounds = map.getBounds();
    var featureLatLng = L.latLng(
        feature.geometry.coordinates[1],
        feature.geometry.coordinates[0]
        );

    // 現在の地図表示範囲にマーカーの緯度経度が含まれてれば表示
    if(mapBounds.contains(featureLatLng) && feature.properties.Type == matchStr) {
        return true;
    }
    return false;
}

/**
 * GeoJsonで読み込んだ施設情報にポップアップを設定する
 */
function onEachFeatureFunc(feature,layer) {
    setPopup(feature,layer);
    setFacilities(feature,layer);
}

/**
 * 施設情報管理用変数に値をセット
 */
function setFacilities(feature,layer) {
    if (feature.properties){
        var facName = feature.properties.Name;
        var obj = {
            facility : facName,
            name : facName,
            lon : feature.geometry.coordinates[1],
            lat : feature.geometry.coordinates[0],
            layer : layer
        };
        facilities.push(obj);
        moveToList[facName] = obj;
    }
}

/**
 * ポップアップコンテンツを定義
 */
function setPopup(feature,layer) {
    var popupTitle = getPopupTitle(feature);
    var popupContent = getPopupContent(feature);

    // ポップアップ表示内容を生成
    var content = '';
    content += '<div id="popup-title" data-role="header" data-theme="a">' + popupTitle + '</div>';
    content += '<div id="popup-content" role="main">' + popupContent + '</div>';

    layer.bindPopup(content);
}

/**
 * ポップアップコンテンツのタイトルを定義する
 */
function getPopupTitle(feature)
{
    // タイトル部
    var title = '';
    var type = feature.properties['種別'] ? feature.properties['種別'] : feature.properties['Type'];
    title  = '[' + type + '] ';
    var owner = feature.properties['設置'] ? feature.properties['設置'] : feature.properties['Ownership'];
    if(owner !== undefined && owner !== null && owner !== "") {
        title += ' [' + owner +']';
    }
    var name = feature.properties['名称'] ? feature.properties['名称'] : feature.properties['Name'];
    title += name;
    url = feature.properties['url'];
    if(url != null && url != '') {
        title = '<a href="' +url+ '" target="_blank">' + title + '</a>';
    }
    return title;
}

/**
 * ポップアップコンテンツの内容を定義する
 */
function getPopupContent(feature) {
    var content = '';
    content += '<table><tbody>';
    var open  = feature.properties['開園時間'] ? feature.properties['開園時間'] : feature.properties['Open'];
    var close = feature.properties['終園時間'] ? feature.properties['終園時間'] : feature.properties['Close'];
    if (open !== undefined && open != null && open != "" && close != undefined && close != null && close != "") {
        content += '<tr>';
        content += '<th>時間</th>';
        content += '<td>';
        content += open + '〜' + close;
        content += '</td>';
        content += '</tr>';
    }
    var memo = feature.properties['備考'] ? feature.properties['備考'] : feature.properties['Memo'];
    if (memo !== undefined && memo !== null) {
        content += '<tr>';
        content += '<th></th>';
        content += '<td>' + memo + '</td>';
        content += '</tr>';
    }
    var temp    = feature.properties['一時'] ? feature.properties['一時'] : feature.properties['Temp'];
    var holiday = feature.properties['休日'] ? feature.properties['休日'] : feature.properties['Holiday'];
    var night   = feature.properties['夜間'] ? feature.properties['夜間'] : feature.properties['Night'];
    var h24     = feature.properties['H24'] ? feature.properties['H24'] : feature.properties['H24'];

    if( temp !== null || holiday !== null || night !== null || h24 !== null) {
        content += '<tr>';
        content += '<th></th>';
        content += '<td>';
        if (temp !== undefined && temp !== null) {
            content += '一時保育 ';
        }
        if (holiday !== undefined && holiday !== null) {
            content += '休日保育 ';
        }
        if (night !== undefined && night !== null) {
            content += '夜間保育 ';
        }
        if (h24 !== undefined && h24 !== null) {
            content += '24時間 ';
        }
        content += '</td>';
        content += '</tr>';
    }

    var type = feature.properties['種別'] ? feature.properties['種別'] : feature.properties['Type'];
    if(type == "認可外") {
        content += '<tr>';
        content += '<th>監督基準</th>';
        content += '<td>';
        var proof = feature.properties['証明'] ? feature.properties['証明'] : feature.properties['Proof'];
        if (proof !== undefined && proof !== null) {
            content += '証明書発行済<a href="http://www.city.sapporo.jp/kodomo/kosodate/ninkagai_shisetsu.html" target="_blank">(詳細)</a>';
        }
        content += '</td>';
        content += '</tr>';
    }
    if(type == "認可保育所") {
        content += '<tr>';
        content += '<th>欠員</th>';
        content += '<td>';
        var vacancy = feature.properties['Vacancy'] ? feature.properties['Vacancy'] : feature.properties['Vacancy'];
        if (vacancy !== undefined && vacancy !== null) {
            content += '<a href="http://www.city.sapporo.jp/kodomo/kosodate/l4_01.html" target="_blank">空きあり</a>';
        }
        var vacancyDate = feature.properties['VacancyDate'];
        if (vacancyDate !== undefined && vacancyDate !== null) {
            content += " (" + vacancyDate + ")";
        }
        content += '</td>';
        content += '</tr>';
    }
    var ageS = feature.properties['開始年齢'] ? feature.properties['開始年齢'] : feature.properties['AgeS'];
    var ageE = feature.properties['終了年齢'] ? feature.properties['終了年齢'] : feature.properties['AgeE'];
    if (ageS !== undefined && ageS !== null && ageE !== undefined && ageE !== null) {
        content += '<tr>';
        content += '<th>年齢</th>';
        content += '<td>' + ageS + '〜' + ageE + '</td>';
        content += '</tr>';
    }
    var full = feature.properties['定員'] ? feature.properties['定員'] : feature.properties['Full'];
    if (full !== undefined && full !== null) {
        content += '<tr>';
        content += '<th>定員</th>';
        content += '<td>' + full + '人</td>';
        content += '</tr>';
    }
    var tel = feature.properties['TEL'] ? feature.properties['TEL'] : feature.properties['TEL'];
    if (tel !== undefined && tel !== null) {
        content += '<tr>';
        content += '<th>TEL</th>';
        content += '<td>' + tel + '</td>';
        content += '</tr>';
    }
    var add1 = feature.properties['住所１'] ? feature.properties['住所１'] : feature.properties['Add1'];
    var add2 = feature.properties['住所２'] ? feature.properties['住所２'] : feature.properties['Add2'];
    if (add1 !== undefined && add2 !== undefined) {
        content += '<tr>';
        content += '<th>住所</th>';
        content += '<td>' + add1 + add2 +'</td>';
        content += '</tr>';
    }
    var owner = feature.properties['設置者'] ? feature.properties['設置者'] : feature.properties['Owner'];
    if (owner !== undefined && owner !== null) {
        content += '<tr>';
        content += '<th>設置者</th>';
        content += '<td>' + owner + '</td>';
        content += '</tr>';
    }
    content += '</tbody></table>';
    return content;
}

/**
 * 縮尺完了後にマーカーのラベル表示・非表示を切り替える
 */
function showMarkerLabel() {
    map.eachLayer(function(layer){
        showMarkerLabelForLayer(layer);
    });
}

/**
 * 縮尺完了後にマーカーのラベル表示・非表示を切り替える:個々のレイヤー版
 */
function showMarkerLabelForLayer(layer) {
    var targetLayer = (layer.layer == undefined) ? layer : layer.layer;

    if (targetLayer instanceof L.Marker) {
        targetLayer.hideLabel();
        targetLayer.setLabelNoHide(false);
    }
    if(map.getZoom() >= 14) {
        // 地図の現在の表示範囲を取得
        var mapBounds = map.getBounds();
        if (targetLayer instanceof L.Marker) {
            var layerLatLng = targetLayer.getLatLng();
            // マーカーの緯度経度が現在の地図表示範囲に含まれてればラベルを表示
            if(mapBounds.contains(layerLatLng)) {
                targetLayer.showLabel();
                targetLayer.setLabelNoHide(true);
            }
        }
    }
}

/**
 * 地図移動時に、変数で保持してるJSONから施設情報を読み込みマーカーを設定する
 */
function showFacilities() {
    // マップのレイヤー情報から施設のレイヤー情報を取得する
    var facilityGroup1, facilityGroup2, facilityGroup3, middleSchool, elementary = null;
    var _facilityGroup1, _facilityGroup2, _facilityGroup3, _middleSchool, _elementary = null;
    map.eachLayer(function(layer){
        var facFlag = false;
        if(L.stamp(layer) == facLayerIds['facilityGroup1']) {
            facilityGroup1 = layer;
            _facilityGroup1 = L.geoJson(
                facJson, {
                onEachFeature: onEachFeatureFunc,
                pointToLayer: pointToLayerFunc,
                filter: facilityGroup1Filter
            });
            facFlag = true;
        } else if(L.stamp(layer) == facLayerIds['facilityGroup2']) {
            facilityGroup2 = layer;
            _facilityGroup2 = L.geoJson(
                facJson, {
                onEachFeature: onEachFeatureFunc,
                pointToLayer: pointToLayerFunc,
                filter: facilityGroup2Filter
            });
            facFlag = true;
        } else if(L.stamp(layer) == facLayerIds['facilityGroup3']) {
            facilityGroup3 = layer;
            _facilityGroup3 = L.geoJson(
                facJson, {
                onEachFeature: onEachFeatureFunc,
                pointToLayer: pointToLayerFunc,
                filter: facilityGroup3Filter
            });
            facFlag = true;
        } else if(L.stamp(layer) == facLayerIds['middleSchool']) {
            middleSchool = layer;
            _middleSchool = L.geoJson(
                midSchoolJson, {
                onEachFeature: function(feature, layer) {
                },
                pointToLayer: midSchoolPointToLayerFunc,
                filter: schoolGroupFilter
            });
            facFlag = true;
        } else if(L.stamp(layer) == facLayerIds['elementary']) {
            elementary = layer;
            _elementary = L.geoJson(
                elemJson, {
                onEachFeature: function(feature, layer) {
                },
                pointToLayer: elementarySchoolPointToLayerFunc,
                filter: schoolGroupFilter
            });
            facFlag = true;
        }

        if(facFlag) {
            // ポップアップを開いていないマーカーだけlayerGroupから削除
            layer.eachLayer(function(innerLayer){
                if(innerLayer._popup._isOpen == false) {
                    layer.removeLayer(innerLayer);
                }
            });
        }
    });

    if(facilityGroup1 != null) {
        _facilityGroup1.eachLayer(function(layer){
            facilityGroup1.addLayer(layer);
        });
    }
    if(facilityGroup2 != null) {
        _facilityGroup2.eachLayer(function(layer){
            facilityGroup2.addLayer(layer);
        });
    }
    if(facilityGroup3 != null) {
        _facilityGroup3.eachLayer(function(layer){
            facilityGroup3.addLayer(layer);
        });
    }
    if(middleSchool != null) {
        var middleSchoolBg = L.d3Layer(
            midSchoolBgJson[0],
            {
                'stroke': "#7379AE",
                'fill': "#7379AE"
            });
        middleSchool.addLayer(middleSchoolBg);

        _middleSchool.eachLayer(function(layer) {
            middleSchool.addLayer(layer);
        });
    }
    if(elementary != null) {
        var elementaryBg = L.d3Layer(
            elemBgJson[0],
            {
                'stroke': "#1BA466",
                'fill': "#1BA466"
            });
        elementary.addLayer(elementaryBg);
        _elementary.eachLayer(function(layer) {
            elementary.addLayer(layer);
        });
    }
}

/**
 * 絞込フィルターを適用する
 */
function applySearchFilter() {
    enableFilter = true;
    showSearchFilter = false;
    sidebar.hide();
    showFacilities();
}

/**
 * 絞込フィルターを外す
 */
function resetSearchFilter() {
    enableFilter = false;
    showFacilities();
}

/**
 * 認可保育園 : 保育施設の属性で絞り込むフィルター
 * openLayers版は複数施設に対するフィルターだったが、
 * Leaflet.js 版は施設ごとにフィルタリング
 */
function facilityGroup1SearchFilter(feature, layer) {
    // 終園時間
    var ninkaFlag = true;
    var ninkaCloseTime = $('#ninkaCloseTime').val();
    if(ninkaCloseTime) {
        switch(ninkaCloseTime) {
            case "18":
                checkAry = ["18:00","19:00","20:00","22:00","0:00"];
                break;
            case "19":
                checkAry = ["19:00","20:00","22:00","0:00"];
                break;
            case "20":
                checkAry = ["20:00","22:00","0:00"];
                break;
            case "22":
                checkAry = ["22:00","0:00"];
                break;
            case "24":
                checkAry = ["0:00"];
                break;
        }
        var close = feature.properties['Close'];
        if($.inArray(close, checkAry) >= 0) {
            ninkaFlag = true;
        } else {
            ninkaFlag = false;
        }
    }

    // 一時保育
    var tmpFlag = true;
    var ninkaIchijiHoiku = $('#ninkaIchijiHoiku:checked').val();
    if(ninkaIchijiHoiku != undefined) {
        var temp = feature.properties['Temp'];
        if(temp != null) {
            tmpFlag = true;
        } else {
            tmpFlag = false;
        }
    }

    // 夜間
    var yakanFlag = true;
    var ninkaYakan = $('#ninkaYakan:checked').val();
    if(ninkaYakan !== undefined) {
        var night = feature.properties['Night'];
        if(night != null) {
            yakanFlag = true;
        } else {
            yakanFlag = false;
        }
    }

    // 休日
    var holydayFlag = true;
    var ninkaKyujitu = $('#ninkaKyujitu:checked').val();
    if(ninkaKyujitu !== undefined) {
        var holiday = feature.properties['Holiday'];
        if(holiday != null) {
            holydayFlag = true;
        } else {
            holydayFlag = false;
        }
    }

    // 空きあり
    var ninkaVacancyFlag = true;
    var ninkaVacancy = $('#ninkaVacancy:checked').val();
    if(ninkaVacancy !== undefined) {
        var vacancy = feature.properties['Vacancy'];
        if(vacancy != null) {
            ninkaVacancyFlag = true;
        } else {
            ninkaVacancyFlag = false;
        }
    }

    // 複数条件の結果を論理演算
    var result = (ninkaFlag && tmpFlag && yakanFlag && holydayFlag && ninkaVacancyFlag);
    return result;
}

/**
 * 認可外保育園 : 保育施設の属性で絞り込むフィルター
 * openLayers版は複数施設に対するフィルターだったが、
 * Leaflet.js 版は施設ごとにフィルタリング
 */
function facilityGroup2SearchFilter(feature, layer) {
    // 開園時間
    var ninkagaiOpenTimeFlag = true;
    var ninkagaiOpenTime = $('#ninkagaiOpenTime').val();
    if(ninkagaiOpenTime) {
        var open = feature.properties['Open'];
        if(open == ninkagaiOpenTime) {
            ninkagaiOpenTimeFlag = true;
        } else {
            ninkagaiOpenTimeFlag = false;
        }
    }

    // 終園時間
    var ninkagaiCloseTimeFlag = true;
    var ninkagaiCloseTime = $('#ninkagaiCloseTime').val();
    if(ninkagaiCloseTime) {
        switch(ninkagaiCloseTime) {
            case "18":
                checkAry = ["18:00","19:00","19:30","19:45","20:00","20:30","22:00","23:00","3:00"];
                break;
            case "19":
                checkAry = ["19:00","19:30","19:45","20:00","20:30","22:00","23:00","3:00"];
                break;
            case "20":
                checkAry = ["20:00","20:30","22:00","23:00","3:00"];
                break;
            case "22":
                checkAry = ["22:00","23:00","3:00"];
                break;
            case "27":
                checkAry = ["3:00"];
                break;
        }
        var h24   = feature.properties['H24'];
        var close = feature.properties['Close'];
        if(h24 !== null || $.inArray(close, checkAry) >= 0) {
            ninkagaiCloseTimeFlag = true;
        } else {
            ninkagaiCloseTimeFlag = false;
        }
    }

    // 24時間フラグ
    var ninkagai24HFlag = true;
    var ninkagai24H = $('#ninkagai24H:checked').val();
    if(ninkagai24H !== undefined) {
        var h24 = feature.properties['H24'];
        if(h24 !== null) {
            ninkagai24HFlag = true;
        } else {
            ninkagai24HFlag = false;
        }
    }

    // 証明書あり
    var ninkagaiShomeiFlag = true;
    var ninkagaiShomei = $('#ninkagaiShomei:checked').val();
    if(ninkagaiShomei !== undefined) {
        var proof = feature.properties['Proof'];
        if(proof !== null) {
            ninkagaiShomeiFlag = true;
        } else {
            ninkagaiShomeiFlag = false;
        }
    }

    var result = (ninkagaiOpenTimeFlag && ninkagaiCloseTimeFlag && ninkagai24HFlag && ninkagaiShomeiFlag);
    return result;
}
