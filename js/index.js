$(function() {
    // 図形操作用サービス
    let sps = new ShapeService();
    // キャンバスのID
    let canvasId = "appCanvas";
    let $canvas = $("#"+canvasId);

    // キャンバス情報
    let canvas = document.getElementById(canvasId);
    let ctx = canvas.getContext("2d");
    let canvasPosition = canvas.getBoundingClientRect();
    // キャンバスのサイズを再設定
    canvas.width  = canvasPosition.width;
    canvas.height = canvasPosition.height;

    // 背景グリッド線データ
    let gridTop = canvasPosition.height * sps.gridTopRate;
    let gridLeft = canvasPosition.width * sps.gridLeftRate;
    let cellSize = canvasPosition.height * sps.cellSizeRate;
    let cellsWidth = sps.cellsWidth;
    let cellsHeight = sps.cellsHeight;
    // グリッド線情報（x・y座標の範囲、グリッド各点の座標）
    let gridInfo = sps.setGridInfo(gridTop, gridLeft, cellsWidth, cellsHeight, cellSize);

    // キロ画像
    let zerokmImg = new Image();
    zerokmImg.src = "./img/okm.png";
    let fivekmImg = new Image();
    fivekmImg.src = "./img/5km.png";
    let kmGuideImg = new Image();
    kmGuideImg.src = "./img/km_guide.png";

    // 図形データ
    let shape = [];
    // 線データ
    let lines = [];
    let root = [];

    // 各ボタンDOM
    let $btns = $('.btn');
    let $drawLineBtn = $('#drawLine');  // 「線を引く」ボタン
    let $restartBtn = $('#restart');    // 「やりなおし」ボタン

    // ボタン位置を調整
    let btnCssSet = function() {
        let btnWidth = canvasPosition.width * 0.15;
        let btnHeight = btnWidth / 221 * 68;
        $btns.height(btnHeight).width(btnWidth).css({'right': canvasPosition.width * 0.04});
        $restartBtn.css({'bottom': canvasPosition.height * 0.07});
        $drawLineBtn.css({'bottom': canvasPosition.height * 0.08 + btnHeight});
    };
    btnCssSet();    // 初期実行

    // 画面リサイズ時（Canvasのレスポンシブ対応）
    let resize = function() {
        // 元のキャンバスの高さを取得
        let originCanvasHeight = canvasPosition.height;
        // キャンバスの位置、サイズを再取得
        canvasPosition = canvas.getBoundingClientRect();

        // キャンバスのサイズを再設定
        canvas.width  = canvasPosition.width;
        canvas.height = canvasPosition.height;

        // ボタン位置を調整
        btnCssSet();

        // リサイズした図形の座標を再計算する
        let scale = canvasPosition.height / originCanvasHeight;

        // グリッド線の位置を再計算
        gridTop = canvasPosition.height * sps.gridTopRate;
        gridLeft = canvasPosition.width * sps.gridLeftRate;
        cellSize = canvasPosition.height * sps.cellSizeRate;
        // グリッド線情報を再計算
        gridInfo = sps.setGridInfo(gridTop, gridLeft, cellsWidth, cellsHeight, cellSize);
        // 背景破線図形を再計算
        //backShape = sps.calcBackShape(gridLeft, gridTop, cellSize);

        // ボタン位置を調整
        btnCssSet();

        // リサイズした図形の座標を再計算する
        /*
        shape.forEach(s => {
            sps.recalculateMatrix(scale, gridInfo, s);
        });
        */
        shape.forEach(function (s) {
            sps.recalculateMatrix(scale, gridInfo, s);
        });

        // リサイズした描画線の座標を再計算する
        sps.recalculateLineMatrix(scale, gridInfo, lines);
    };
    $(window).resize(resize);

    // マウスダウン（orタッチ）中かどうか
    let touched = false;
    // タッチ開始時の座標を記録
    let touchStartX = 0;
    let touchStartY = 0;
    // 移動時のタッチ座標
    let touchX = 0;
    let touchY = 0;

    // 「線を引く」線
    let drawLineMode = false;
    let drawLineStart = false;
    let lineStartP = [0, 0];    // 開始地点
    let lineEndP = [0, 0];      // 終了地点

    /**
     * カーソルを鉛筆アイコンに切り替える
     */
    let $body = $('#body');
    // カーソルアイコン切替モード
    let cursorMode = 0; // 0: 通常、1: 鉛筆アイコン、2: 消しゴムアイコン
    let cursorPositionAdjustment = 10;
    // カーソル位置（canvasに対しての相対位置）
    let cursorX = 0;
    let cursorY = 0;
    // マウス移動中（またはタッチ中）かどうか
    let mouseMoved = false;
    // アイコン画像
    let pencilImg = new Image();
    pencilImg.src = "./img/pencil.png";
    let eraserImg = new Image();
    eraserImg.src = "./img/eraser_b.png";
    // アイコンサイズ
    let iconSize = 30;
    let changeCursorPointer = function(event, status) {
        cursorMode = status;

        if (0 !== status) {
            $body.css('cursor', 'none');
        } else {
            $body.css('cursor', 'auto');
        }
    };
    /**
     * 図形の描画
     */
    let drawShapes = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 図形を描画
        shape.forEach(function (s) {
            ctx.lineJoin = "round";
            ctx.beginPath();
            for (let i = 0; i < s['matrix'].length; i++) {
                ctx.lineTo(s['matrix'][i][0], s['matrix'][i][1]);
            }
            ctx.lineWidth = 3;
            ctx.fillStyle = 'rgb(254, 212, 212)';
            ctx.fill();
            ctx.lineWidth = sps.shapeLineWidth;
            ctx.strokeStyle = "rgb(0, 0, 0)";
            ctx.setLineDash([]);
            ctx.stroke();

        });

        // グリッド線の描画
        ctx.lineJoin = "miter";
        ctx.lineWidth = sps.gridLineWidth;
        ctx.strokeStyle = sps.gridLineColor;
        ctx.setLineDash([]);
        // 横線を描画
        let gridLineStart = [gridLeft, gridTop];
        let gridLineEnd = [gridLeft + cellsWidth * cellSize, gridTop];

        for (let s = 0; s < cellsHeight+1; s++) {
            gridLineStart[1] = gridTop + s * cellSize;
            gridLineEnd[1] = gridTop + s * cellSize;

            ctx.beginPath();
            ctx.moveTo(gridLineStart[0], gridLineStart[1]);
            ctx.lineTo(gridLineEnd[0], gridLineEnd[1]);
            ctx.closePath();
            ctx.stroke();
        }

        // 縦線を描画
        gridLineStart = [gridLeft, gridTop];
        gridLineEnd = [gridLeft, gridTop + cellsHeight * cellSize];

        for (let t = 0; t < cellsWidth+1; t++) {
            gridLineStart[0] = gridLeft + t * cellSize;
            gridLineEnd[0] = gridLeft + t * cellSize;

            ctx.beginPath();
            ctx.moveTo(gridLineStart[0], gridLineStart[1]);
            ctx.lineTo(gridLineEnd[0], gridLineEnd[1]);
            ctx.closePath();
            ctx.stroke();
        }

        //0~5km,km_guideを描画
        let zerokmPosition = [gridLeft + cellSize * 17.65, gridTop + cellSize * 29.35];
        ctx.drawImage(zerokmImg, zerokmPosition[0], zerokmPosition[1], cellSize * 0.7, cellSize * 1.05);
        let fivekmPosition = [gridLeft + cellSize * 22, gridTop + cellSize * 29.35];
        ctx.drawImage(fivekmImg, fivekmPosition[0], fivekmPosition[1], cellSize * 2, cellSize * 1);
        let kmGuidePosition = [gridLeft + cellSize * 17.41, gridTop + cellSize * 30.55];
        ctx.drawImage(kmGuideImg, kmGuidePosition[0], kmGuidePosition[1], cellSize * 6.1, cellSize * 0.5);

        // 描画線を描画
        for (let i = 0; i < lines.length; i++) {
            ctx.beginPath();
            ctx.moveTo(lines[i]['start'][0], lines[i]['start'][1]);
            ctx.lineTo(lines[i]['end'][0], lines[i]['end'][1]);
            ctx.closePath();
            ctx.lineWidth = 3;
            ctx.strokeStyle = "rgb(0, 0, 0)";
            ctx.setLineDash([]);
            ctx.stroke();
        }
        // 「線を引く」線の描画
        if (drawLineMode) {
            // 「切る」モード時のみ
            ctx.lineJoin = "miter";
            ctx.beginPath();
            ctx.moveTo(lineStartP[0], lineStartP[1]);
            ctx.lineTo(lineEndP[0], lineEndP[1]);
            ctx.closePath();
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgb(0, 0, 0)';
            ctx.setLineDash([1,3]);
            ctx.stroke();
        }

        // 鉛筆アイコンの表示
        if (cursorMode !== 0 && mouseMoved) {
            let cursorIconX = cursorX;
            let cursorIconY = cursorY - iconSize / 2 - cursorPositionAdjustment;
            if (cursorMode === 1) {
                ctx.drawImage(pencilImg, cursorIconX, cursorIconY, iconSize, iconSize);
            } else {
                ctx.drawImage(eraserImg, cursorIconX, cursorIconY, iconSize, iconSize);
            }
        }
    };

    /**
     * レンダリング処理
     * （「切る」モードや「移動」モード時のみレンダリングを実行する）
     */
    let renderAnimation = null;
    let render = function() {
        drawShapes();
        renderAnimation = window.requestAnimationFrame(render);
    };
    render();

    /**
     * 「線を引く」モード切替処理
     * @param status
     */
    let changeDrawLineMode = function (status) {
        drawLineMode = status;
        if (status) {
            $drawLineBtn.addClass('active');
        } else {
            $drawLineBtn.removeClass('active');
        }
    };

    /**
     * マウスダウン（orタッチ）開始時の処理
     * @param e 操作イベント
     */
    let onMouseDown = function (e) {
        e.preventDefault(); // デフォルトイベントをキャンセル
        touched = true; // マウスダウン（orタッチ）中

        let downPoint = sps.getTouchPoint(e, canvasPosition.top, canvasPosition.left);   // マウスダウン（orタッチ）座標
        touchX = downPoint[0];
        touchY = downPoint[1];

        // タッチ開始時の座標を記録
        touchStartX = Math.floor(downPoint[0]);
        touchStartY = Math.floor(downPoint[1]);

        if (drawLineMode) {
            // 「線を引く」モード時
            // グリッド内をタッチした場合のみラインを描画
            let cutStartPoint = sps.getNearestGridPoint([touchX, touchY], gridInfo);
            if (null !== cutStartPoint) {
                drawLineStart = true;
                lineStartP = [cutStartPoint[0], cutStartPoint[1]];
                lineEndP = [cutStartPoint[0], cutStartPoint[1]];
            }
        }
    };
    canvas.addEventListener('mousedown', onMouseDown, false);
    canvas.addEventListener('touchstart', onMouseDown, false);

    /**
     * マウスダウン（タッチ移動）中の処理
     * @param e
     */
    let onMouseMove = function (e) {
        e.preventDefault(); // デフォルトイベントをキャンセル

        let downPoint = sps.getTouchPoint(e, canvasPosition.top, canvasPosition.left);   // マウスダウン（orタッチ）座標

        if (touched) {
            // 移動後の座標
            let currentX = downPoint[0];
            let currentY = downPoint[1];
            if (drawLineMode && drawLineStart) {
                // 「線を引く」モード時、かつ有効なラインスタート地点の場合
                // 「線を引く」線の終了地点を更新
                let endPoint = sps.getGridPointOnLine(lineStartP, [currentX, currentY], gridInfo);
                lineEndP[0] = endPoint[0];
                lineEndP[1] = endPoint[1];

                // アイコンは必ず鉛筆アイコンにする
                cursorMode = 1;
            }
            // マウスダウン（タッチ）開始座標を更新
            touchX = currentX;
            touchY = currentY;

        }

        // マウス移動中かどうか
        mouseMoved = true;

        // カーソルの位置を更新
        cursorX = downPoint[0];
        cursorY = downPoint[1];

        if (drawLineMode && !drawLineStart) {
            // すでに引いた線上にあるかどうか判定、線上であれば消しゴムアイコン表示
            let deleteLineIndex = sps.getDeleteLineIndex(downPoint, lines);
            if (deleteLineIndex !== null) {
                // 線上にある場合
                cursorMode = 2;
            } else {
                cursorMode = 1;
            }
        }
    };
    canvas.addEventListener('mousemove', onMouseMove, false);
    canvas.addEventListener('touchmove', onMouseMove, false);


        /**
         * 配列に要素が含まれているかチェックする
         * @param 存在確認用対象配列 targetArray
         * @param 存在確認対象値 val
         */
        let contains = function (targetArray, val) {
            //return targetArray.some(item => JSON.stringify(item) === JSON.stringify(val));
            return targetArray.some(function (item) { return JSON.stringify(item) === JSON.stringify(val); });
        }

        /**
         * 線に対して始点・終点と紐づく別の線が存在するかチェックする
         * @param チェック対象線配列 lineArray
         * @param チェック対象線情報 checkLine
         */
        let isClosedLine = function (lineArray, checkLine) {
            let isJoinedStart = false;
            let isJoinedEnd = false;
            lineArray.filter(function (line) {
                return JSON.stringify(line) !== JSON.stringify(checkLine);
            }).forEach(function (line) {
                if (JSON.stringify(checkLine['start']) === JSON.stringify(line['start']) ||
                    JSON.stringify(checkLine['start']) === JSON.stringify(line['end'])) {
                    isJoinedStart = true;
                }

                if (JSON.stringify(checkLine['end']) === JSON.stringify(line['start']) ||
                    JSON.stringify(checkLine['end']) === JSON.stringify(line['end'])) {
                    isJoinedEnd = true;
                }
            });

            return isJoinedStart && isJoinedEnd;
        }

        /**
         * ベースの線に対して接続された線かチェック
         * @param ベースの線 baseLine
         * @param チェック対象線 checkLine
         */
        let isRelatedLine = function(baseLine, checkLine) {
            return JSON.stringify(baseLine['end']) === JSON.stringify(checkLine['start']) ||
                JSON.stringify(baseLine['end']) === JSON.stringify(checkLine['end']);
        }

        /**
         * ベースの線に接続された線を取得。
         * 始点、終点が逆転している場合は反転して取得
         * @param ベースの線 baseLine
         * @param チェック対象線 checkLine
         */
        let getRelatedLine = function(baseLine, checkLine) {
            if(isRelatedLine(baseLine, checkLine)) {
                if(JSON.stringify(baseLine['end']) === JSON.stringify(checkLine['end'])) {
                    return {'start': checkLine['end'], 'end': checkLine['start']};
                }
                return checkLine;
            }
            return null;
        }

        /**
         * 多角形判定
         * @param 多角形構成要素配列 polygonParts
         */
        let isPolygon = function(polygonParts) {
            return JSON.stringify(polygonParts[0]['start']) === JSON.stringify(polygonParts[polygonParts.length - 1]['end']);
        }

        /**
         * シェイプ描画用の座標の配列を取得する
         * @param 未チェック且つ多角形の要素の線 lines
         * @param ポリゴン構成要素 polygonParts
         */
         /*
        let getShapeMatrix = function (lines, polygonParts = []) {
            if(lines === void 0){
                // チェック対象の線がなくなった場合はポリゴン未完成で処理終了
                return [];
            }

            // チェック対象線と関連する線を取得する
            // 合致線がある場合はチェック対象のリストから除外してさらに派生を調べる
            for (let i = 0; i< lines.length; i++) {
                let x = getRelatedLine(polygonParts[polygonParts.length - 1], lines[i]);
                if(x !== null) {
                    // 関連線をポリゴン構成要素に追加
                    polygonParts.push(x);
                    // 関連線をチェック対象の線から除外
                    lines = lines.filter(function(line) {
                        return JSON.stringify(line) !== JSON.stringify(lines[i]);
                    });
                    return getShapeMatrix(lines, polygonParts);
                }
            }

            // 関連する線が存在しない場合
            // 始点と終点が合致するかチェックする
            // 合致していた場合はシェイプ情報を作成して終了
            if (isPolygon(polygonParts)) {
                //return polygonParts.map(point => [point['start'][0], point['start'][1]]);
                return polygonParts.map(function (point) { return [point['start'][0], point['start'][1]]; });
            } else {
                polygonParts.pop();
                if(polygonParts.length === 0) {
                    // ないはずだけどポリゴン構成要素が0個になったら処理終了
                    return [];
                }
                return getShapeMatrix(lines, polygonParts);
            }
        }
        */
        function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) {
                                  return typeof obj; };
                                } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; }
                                  return _typeof(obj); }

              var getShapeMatrix = function getShapeMatrix(lines) {
                var polygonParts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

                if (lines === void 0) {
                  // チェック対象の線がなくなった場合はポリゴン未完成で処理終了
                  return [];
                } // チェック対象線と関連する線を取得する
                // 合致線がある場合はチェック対象のリストから除外してさらに派生を調べる


                var _loop = function _loop(i) {
                    var x = getRelatedLine(polygonParts[polygonParts.length - 1], lines[i]);

                    if (x !== null) {
                      // 関連線をポリゴン構成要素に追加
                      polygonParts.push(x); // 関連線をチェック対象の線から除外

                      lines = lines.filter(function (line) {
                        return JSON.stringify(line) !== JSON.stringify(lines[i]);
                      });
                      return {
                        v: getShapeMatrix(lines, polygonParts)
                      };
                    }
                };

                for (var i = 0; i < lines.length; i++) {
                  var _ret = _loop(i);

                  if (_typeof(_ret) === "object") return _ret.v;
                } // 関連する線が存在しない場合
                // 始点と終点が合致するかチェックする
                // 合致していた場合はシェイプ情報を作成して終了


                if (isPolygon(polygonParts)) {
                  //return polygonParts.map(point => [point['start'][0], point['start'][1]]);
                  return polygonParts.map(function (point) {
                    return [point['start'][0], point['start'][1]];
                  });
                } else {
                  polygonParts.pop();

                  if (polygonParts.length === 0) {
                    // ないはずだけどポリゴン構成要素が0個になったら処理終了
                    return [];
                  }

                  return getShapeMatrix(lines, polygonParts);
                }
            };
        /**
         * シェイプ再構築
         * @param 全線配列 lines
         */
        let recreateShapes = function(lines) {
            shape = [];
            // 始点、終点のいずれかがどこともつながっていない線を除外
            let closedLines = lines.filter(function (line) {
                return isClosedLine(lines, line);
            });
            closedLines.forEach(function(line) {
                //let matrix = getShapeMatrix(closedLines.filter(l => JSON.stringify(l) !== JSON.stringify(line)), [line]);
                var matrix = getShapeMatrix(closedLines.filter(function (l) { return JSON.stringify(l) !== JSON.stringify(line); }), [line]);
                shape.push({ 'matrix': matrix });
            });
        }

        /**
         * マウスアップ（タッチ終了）時の処理
         * @param e 操作イベント
         */
        let onMouseUp = function (e) {
            e.preventDefault(); // デフォルトイベントをキャンセル
            touched = false; // マウスダウン（orタッチ）中を解除
            // マウス移動を一時解除（タッチデバイスの場合、タッチ終了後に鉛筆アイコンを非表示にする）
            mouseMoved = false;

            let downPoint = sps.getTouchPoint(e, canvasPosition.top, canvasPosition.left);   // マウスダウン（orタッチ）座標
            let touchEndX = Math.floor(downPoint[0]);
            let touchEndY = Math.floor(downPoint[1]);

            if (Math.abs(touchStartX - touchEndX) < 3 && Math.abs(touchStartY - touchEndY) < 3) {
                // クリック判定（タッチ開始時座標と終了座標が僅差であればクリックとみなす）
                let deleteLineIndex = sps.getDeleteLineIndex(downPoint, lines);
                if (deleteLineIndex !== null) {
                    // 削除対称の線がある場合は削除
                    lines.splice(deleteLineIndex, 1);
                    recreateShapes(lines);
                }
            } else{
                if (drawLineMode && drawLineStart) {
                    // 「線を引く」モード時、かつ有効なラインスタート地点の場合
                    // 終了地点で一番近いグリッド点を終了地点とする
                    let endPoint = sps.getNearestGridPoint(lineEndP, gridInfo);
                    // 線が描画するラインとして追加
                    if (null !== endPoint) {
                        let sameLineFlag = sps.judgeSameLine(lineStartP,endPoint,lines);
                        if(!sameLineFlag){
                            // 最後にひかれたライン
                            let lastDrawLine = { 'start': [lineStartP[0], lineStartP[1]], 'end': [endPoint[0], endPoint[1]] };
                            lines.push(lastDrawLine);

                            // 始点、終点のいずれかがどこともつながっていない線を除外
                            let closedLines = lines.filter(function (line) {
                                return isClosedLine(lines, line);
                            });

                            // 分割に関与した線及び最後にひいた線に対してシェイプを再構築
                            if (contains(closedLines, lastDrawLine)) {
                                //let matrix = getShapeMatrix(closedLines.filter(l => JSON.stringify(l) !== JSON.stringify(lastDrawLine)), [lastDrawLine]);
                                var matrix = getShapeMatrix(closedLines.filter(function (l) { return JSON.stringify(l) !== JSON.stringify(lastDrawLine);}), [lastDrawLine]);
                                shape.push({ 'matrix': matrix });
                            }
                        }
                    }
                }
                lineStartP = [0, 0];
                lineEndP = [0, 0];
            }
            drawLineStart = false;  // マウスダウン時の有効なグリッド内タッチのフラグを初期化
        };
        canvas.addEventListener('mouseup', onMouseUp, false);
        canvas.addEventListener('touchend', onMouseUp, false);

        /**
         * 「線を引く」ボタンのクリック時処理
         */
        $drawLineBtn.click(function(e) {
            let currentStatus = drawLineMode;
            // 「線を引く」モード切替処理
            changeDrawLineMode(!currentStatus);
            // 鉛筆アイコンモードを切替
            if (drawLineMode) {
                // カーソル位置を設定（タッチデバイスでもボタン下に鉛筆アイコンが見えないようにする）
                cursorX = -iconSize;
                cursorY = -iconSize;

                cursorMode = 1;
            } else {
                cursorMode = 0;
            }
        });
        $btns.hover(
            function(e) {
                // マウスカーソルが重なった時の処理
                // カーソルの鉛筆モードをOFFにする
                changeCursorPointer(e, 0);
            },
            function(e) {
                // マウスカーソルが離れた時の処理
                if (drawLineMode) {
                    changeCursorPointer(e, 1);
                }
            }
        );
        $canvas.hover(
            function(e) {
                // マウスカーソルが重なった時の処理
                if (drawLineMode) {
                    changeCursorPointer(e, 1);
                }
            },
            function(e) {
                // マウスカーソルが離れた時の処理
                // カーソルの鉛筆モードをOFFにする
                changeCursorPointer(e, 0);
            }
        );

        /**
         * 「やりなおし」ボタンのクリック時処理
         */
        $restartBtn.click(function () {
            location.reload();
        });
    });
