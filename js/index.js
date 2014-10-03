var map;

// 中心座標変更セレクトボックス用データ
var moveToList = [];

function resizeMapDiv() {
	var screenHeight = $.mobile.getScreenHeight();
	var headerHeight = $(".ui-header").hasClass("ui-header-fixed") ?
		$(".ui-header").outerHeight() - 1 : $(".ui-header").outerHeight();
	var contentCurrentHeight = $(".ui-content").outerHeight() - $(".ui-content").height();
	var contentHeight = screenHeight - headerHeight - contentCurrentHeight;
	$(".ui-content").height(contentHeight);
}

$(window).on("orientationchange", function() {
	resizeMapDiv();
	map.setTarget('null');
	map.setTarget('map');
});


$('#mainPage').on('pageshow', function() {
	resizeMapDiv();
	// 地図レイヤー定義
	var tileLayer = new ol.layer.Tile({
		opacity: 1.0,
		source: new ol.source.XYZ({
			attributions: [
				new ol.Attribution({
					html: "<a href='http://portal.cyberjapan.jp/help/termsofuse.html' target='_blank'>国土地理院</a>"
				})
			],
			url: "http://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png",
			projection: "EPSG:3857"
		})
	});

	// 地図レイヤー定義
	map = new ol.Map({
		layers: [
			tileLayer,
			// 中学校区
			new ol.layer.Vector({
				source: new ol.source.GeoJSON({
					projection: 'EPSG:3857',
					url: 'data/MiddleSchool_Sapporo.geojson'
				}),
				name: 'layerMiddleSchool',
				style: middleSchoolStyleFunction,
				visible: false
			}),
			// 小学校区
			new ol.layer.Vector({
				source: new ol.source.GeoJSON({
					projection: 'EPSG:3857',
					url: 'data/Elementary_Sapporo.geojson'
				}),
				name: 'layerElementarySchool',
				style: elementaryStyleFunction,
				visible: false
			}),
			// 距離同心円描画用レイヤー
			new ol.layer.Vector({
				source: new ol.source.Vector(),
				name: 'layerCircle',
				style: circleStyleFunction,
				visible: true
			}),
			// こども園
			new ol.layer.Vector({
				source: new ol.source.GeoJSON({
					projection: 'EPSG:3857',
					url: 'data/Kodomoen.geojson'
				}),
				name: 'layerKodomoen',
				style: nurseryStyleFunction
			}),
			// 認可外
			new ol.layer.Vector({
				source: new ol.source.GeoJSON({
					projection: 'EPSG:3857',
					url: 'data/Ninkagai.geojson'
				}),
				name: 'layerNinkagai',
				style: nurseryStyleFunction
			}),
			// 認可
			new ol.layer.Vector({
				source: new ol.source.GeoJSON({
					projection: 'EPSG:3857',
					url: 'data/Ninka.geojson'
				}),
				name: 'layerNinka',
				style: nurseryStyleFunction
			}),
			// 幼稚園
			new ol.layer.Vector({
				source: new ol.source.GeoJSON({
					projection: 'EPSG:3857',
					url: 'data/Kindergarten.geojson'
				}),
				name: 'layerKindergarten',
				style: nurseryStyleFunction
			})
		],
		target: 'map',
		view: new ol.View({
			center: ol.proj.transform([141.347899, 43.063968], 'EPSG:4326', 'EPSG:3857'),
			zoom: 14
		})
	});

	// 距離ライン定義
	scale = new ol.control.ScaleLine({});
	map.addControl(scale);

	// ポップアップ定義
	var popup = new ol.Overlay({
		element: document.getElementById('popup')
	});
	map.addOverlay(popup);


	// 区一覧と区の境界データ、その他公共施設データ読み込み
	$.getJSON(
		"data/wards_sapporo.geojson",
		function(data){
			moveToList.push( {name: "区・公共施設", header:true} );
			var lineName = "";
			for(var i=0; i<data.features.length; i++) {
				switch(data.features[i].geometry.type) {
					case "Point":
						_name = data.features[i].properties.name;
						_lat  = data.features[i].geometry.coordinates[1];
						_lon  = data.features[i].geometry.coordinates[0];
						moveToList.push(
							{name: _name, lat: _lat, lon: _lon, header:false}
							);
						break;
					case "LineString":
						_name        = data.features[i].properties.CITY1 + data.features[i].properties.name;
						_coordinates = data.features[i].geometry.coordinates;
						moveToList.push(
							{name: _name, coordinates: _coordinates, header:false}
							);
				}
			}
			appendToMoveToListBox(moveToList);
		});


	// 駅位置JSONデータ読み込み〜セレクトボックス追加
	$.getJSON(
		"data/station_sapporo.geojson",
		function(data){
			moveToList.push( {name: "公共交通機関施設", header:true} );
			var lineName = "";
			for(var i=0; i<data.features.length; i++) {
				_s = data.features[i].properties["shubetsu"] + " (" + data.features[i].properties["line"] + ")";
				if(lineName !== _s) {
					moveToList.push({name: _s, header: true});
					lineName = _s;
				}
				_name = data.features[i].properties.station_name;
				_lat  = data.features[i].properties.lat;
				_lon  = data.features[i].properties.lon;
				moveToList.push(
					{name: _name, lat: _lat, lon: _lon, header:false}
					);
			}
			appendToMoveToListBox(moveToList);
		});
	/**
	 * 移動先セレクトボックスに要素を追加する
	 * @param  array moveToList [description]
	 * @return {[type]}            [description]
	 */
	function appendToMoveToListBox(moveToList)
	{
		nesting = "";
		for(i=0; i<moveToList.length; i++) {
			if(moveToList[i].header) {
				if(nesting !== "") {
					$('#moveTo').append(nesting);
				}
				nesting = $('<optgroup>').attr('label', moveToList[i].name);
			} else {
				nesting.append($('<option>').html(moveToList[i].name).val(i));
			}
		}
	}

	// 中心座標変更セレクトボックス操作イベント定義
	$('#moveTo').change(function(){
		if(moveToList[$(this).val()].coordinates !== undefined) {
			// 区の境界線に合わせて画面表示
			components = [];
			for(var i=0; i<moveToList[$(this).val()].coordinates.length; i++) {
				coord = moveToList[$(this).val()].coordinates[i];
				pt2coo = ol.proj.transform(coord, 'EPSG:4326', 'EPSG:3857');
				components.push(pt2coo);
			}
			components = [components];

			view = map.getView();
			polygon = new ol.geom.Polygon(components);
			size =  map.getSize();
			var pan = ol.animation.pan({
				duration: 850,
				source: view.getCenter()
			});
			map.beforeRender(pan);

			feature = new ol.Feature({
				geometry: polygon
			});
			layer = getLayer(getLayerName("Circle"));
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
			lon = moveToList[$(this).val()].lon;
			lat = moveToList[$(this).val()].lat;
			if(lon !== undefined && lat !== undefined) {
				animatedMove(lon, lat, true);
			}
			// マーカーを設置
			setMarker(lon, lat, moveToList[$(this).val()].name);
		}
	});

	// 保育施設クリック時の挙動を定義
	map.on('click', function(evt) {
		var element = popup.getElement();
		var feature = map.forEachFeatureAtPixel(evt.pixel,
			function(feature, layer) {
				return feature;
			}
		);
		// ポップアップを消す
		$(element).popover('destroy');

		// クリックした場所に要素がなんにもない場合
		if (feature === undefined) {
			coord = map.getCoordinateFromPixel(evt.pixel);
			view = map.getView();
			animatedMove(coord[0], coord[1], false);
			view.setCenter(coord);
		}
		// クリックした場所に既に描いた同心円がある場合
		if (feature && feature.getGeometry().getType() === "Circle") {
			$('#cbDisplayCircle').attr('checked', false).checkboxradio('refresh');
			layer = getLayer(getLayerName("Circle"));
			source = layer.getSource();
			source.clear();
		}

		// クリックした場所に保育施設がある場合
		if (feature && "Point" == feature.getGeometry().getType()) {
			var geometry = feature.getGeometry();
			var coord = geometry.getCoordinates();
			popup.setPosition(coord);
			$(element).attr('title', '[' + feature.get('種別') + '] ' + feature.get('名称') );
			var content = '';
			if (feature.get('住所１') !== undefined && feature.get('住所２') !== undefined) {
				content += '<div>住所 '+feature.get('住所１')+feature.get('住所２')+'</div>';
			}
			if (feature.get('電話番号') !== undefined) {
				content += '<div>TEL '+feature.get('電話番号')+'</div>';
			}
			if (feature.get('定員') !== null) {
				content += '<div>定員 '+feature.get('定員')+'人</div>';
			}
			if (feature.get('年齢') !== undefined) {
				content += '<div>年齢 '+feature.get('年齢')+'</div>';
			}
			animatedMove(coord[0], coord[1], false);
			$(element).popover({
				'animation': false,
				'placement': 'top',
				'html': true,
				'content': content
			});
			$("#popup-content").html(content);
			$(element).popover('show');
		}
	});

	/**
	 * 指定した名前のレイヤー情報を取得する
	 * @param  {[type]} layerName [description]
	 * @return {[type]}           [description]
	 */
	function getLayer(layerName) {
		result = null;
		map.getLayers().forEach(function(layer) {
			if (layer.get('name') == layerName) {
				result = layer;
			}
		});
		return result;
	}

	function switchLayer(layerName, visible) {
		map.getLayers().forEach(function(layer) {
			if (layer.get('name') == layerName) {
				layer.setVisible(visible);
			}
		});
	}

	/**
	 * レイヤー名を取得する
	 * @param  {[type]} cbName [description]
	 * @return {[type]}        [description]
	 */
	function getLayerName(cbName)
	{
		return 'layer' + cbName;
	}

	function getLayerNameBySubStred(cbName, count)
	{
		return getLayerName(cbName.substr(count));
	}

	$('#cbKindergarten').click(function() {
		switchLayer(getLayerNameBySubStred(this.id, 2), $(this).prop('checked'));
	});
	$('#cbNinka').click(function() {
		switchLayer(getLayerNameBySubStred(this.id, 2), $(this).prop('checked'));
	});
	$('#cbKodomoen').click(function() {
		switchLayer(getLayerNameBySubStred(this.id, 2), $(this).prop('checked'));
	});
	$('#cbNinkagai').click(function() {
		switchLayer(getLayerNameBySubStred(this.id, 2), $(this).prop('checked'));
	});
	$('#cbMiddleSchool').click(function() {
		switchLayer(getLayerNameBySubStred(this.id, 2), $(this).prop('checked'));
	});
	$('#cbElementarySchool').click(function() {
		switchLayer(getLayerNameBySubStred(this.id, 2), $(this).prop('checked'));
	});

	// 地図の透明度を変更するセレクトボックス
	$('#changeOpacity').change(function(){
		opacity = 1.0;
		if($(this).val() !== "" && $(this).val() > 0) {
			opacity = $(this).val();
		}
		tileLayer.setOpacity(opacity);
	});

	$('#changeCircleRadius').change(function(evt){
		radius = $(this).val();
		if(radius === "") {
			radius = 500;
		}
		drawCenterCircle(radius);
	});

	$('#cbDisplayCircle').click(function(evt) {
		radius = $('#changeCircleRadius').val();
		if(radius === "") {
			radius = 500;
		}
		drawCenterCircle(radius);
	});

	function drawCenterCircle(radius)
	{
		layer = getLayer(getLayerName("Circle"));
		source = layer.getSource();
		source.clear();
		if($('#cbDisplayCircle').prop('checked')) {
			view           = map.getView();
			coord          = view.getCenter();
			circleFeatures = drawConcentricCircle(coord, radius);
			source.addFeatures(circleFeatures);
		}
		return;
	}

	/**
	 * 同心円を描く
	 *
	 * @param  {[type]} coordinate [description]
	 * @param  {[type]} maxradius     [description]
	 * @return {[type]}            [description]
	 */
	function drawConcentricCircle(coordinate, maxradius)
	{
		features = [];
		step = Math.floor(maxradius / 5);
		for(var i=0; i<=maxradius; i+=step) {
			circleFeature = new ol.Feature({
				geometry: new ol.geom.Circle(coordinate, i)
			});
			features.push(circleFeature);
		}
		return features;
	}


	/**
	 * 指定した緯度経度座標にマーカーを設置する
	 *
	 */
	function setMarker(lon, lat, label)
	{
		// マーカーを設置
		var pos = ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
		// Vienna marker
		var marker = new ol.Overlay({
			position: pos,
			positioning: 'center-center',
			element: $('#marker'),
			stopEvent: false
		});
		map.addOverlay(marker);

		// ラベル設定
		$('#markerTitle').html(label);
		var markerTitle = new ol.Overlay({
			position: pos,
			element: $('#markerTitle')
		});
		map.addOverlay(markerTitle);
	}

	/**
	 * 指定した座標にアニメーションしながら移動する
	 * isTransform:
	 * 座標参照系が変換済みの値を使うには false,
	 * 変換前の値を使うには true を指定
	 */
	function animatedMove(lon, lat, isTransform)
	{
		// グローバル変数 map から view を取得する
		view = map.getView();
		var pan = ol.animation.pan({
			duration: 850,
			source: view.getCenter()
		});
		map.beforeRender(pan);
		if(isTransform) {
			// 座標参照系を変換する
			view.setCenter(
				ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857')
			);
		} else {
			// 座標系を変換しない
			view.setCenter([lon, lat]);
		}
	}
});
