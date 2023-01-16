import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
// eslint-disable-next-line no-unused-vars
import { angle, easing, Globe, path, SkyCoord } from '@stellar-globe/stellar-globe'
// eslint-disable-next-line import/no-unresolved, import/extensions, no-unused-vars
import { Constellation, EsoMilkyWay, Grid, HipparcosCatalog, Patch, PatchSelector, Path, PrettyPictures, SspData, StellarGlobe, Tract, TractSelector } from '../../component/StellarGlobe'


function DataSelector() {
  const globeRef = useRef(null)
  /** @type { () => Globe } */
  const globe = () => globeRef.current.globe()

  // M31へカメラを移動
  const goM31 = useCallback(() => {
    globe().camera.jumpTo({
      fovy: angle.deg2rad(1), // 画角 (radian)
    }, {
      coord: SkyCoord.parse('00:42:44.3 +41:16:9'), // 移動先座標 M31の座標
      duration: 400, // 移動時間
      easingFunction: easing.fastStart4, // 移動easing関数
    })
  }, [])

  // 全天モードにカメラを移動
  const goAllSky = useCallback(() => {
    globe().camera.jumpTo({
      fovy: 1,
    }, {
      coord: SkyCoord.fromDeg(0, 0), // 移動先座標 赤経0度、赤緯0度
    })
  }, [])

  // Tract枠へ移動
  const goTracts = useCallback(() => {
    globe().camera.jumpTo({
      fovy: angle.deg2rad(1), // 画角 (radian)
    }, {
      coord: SkyCoord.fromDeg(2.9629628244459547, 0.7438016385045446),
      duration: 400, // 移動時間
      easingFunction: easing.fastStart4, // 移動easing関数
    })
  }, [])

  // tract, patct関係
  const [showTract, setShowTract] = useState(true)
  const tractIds = useMemo(() => [9470, 9471, 9472, 8742, 10675], [])
  const [selectedTractId, setSelectedTractId] = useState(undefined)
  const [selectedPatchId, setSelectedPatchId] = useState(undefined)
  const tractStyle = useMemo(() => ({
    baseColor: [0, 1, 1, 0.25], // 青緑
    hoverColor: [0, 1, 0, 0.5], // 緑
    activeColor: [1, 0, 0, 1], // 赤
  }), [])
  const selectedColor = useMemo(() => [1, 0, 1, 1])
  const tractOnClick = useCallback((tractIndex) => {
    setSelectedTractId(tractIndex)
  }, [])
  const patchOnClick = useCallback((patchId) => {
    setSelectedPatchId(patchId)
  }, [])

  // xyz軸表示
  const [showAxis, setShowAxis] = useState(true)
  // eslint-disable-next-line no-use-before-define
  const axisPaths = useMemo(generageAxisPaths, [])

  // 視野中心座標表示
  const [centerCoord, setCenterCoord] = useState('')
  useEffect(() => {
    globe().on('camera-move', () => {
      const { camera } = globe()
      setCenterCoord(JSON.stringify({
        coord: camera.center().toString(),
        fieldOfViewY: camera.fovy.toFixed(2), // radian
      }, null, 2))
    })
  }, [])

  // クリック座標履歴表示
  const [clickedHistory, setClickedHistory] = useState([])
  useEffect(() => {
    globe().on('pointer-down', e => {
      setClickedHistory(_ => [e.coord.toString(), ..._].slice(0, 10))
    })
  }, [])

  // eslint-disable-next-line no-unused-vars
  const sspDataUrl = useMemo(() => {
    const ssl = window.location.protocol === 'https'
    return `${ssl ? 'https' : 'http'}://hscmap.mtk.nao.ac.jp/hscMap4/data/pdr3_wide`
  }, [])

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ flexGrow: 1 }}>
        {/* ビューワー関係はここから */}
        <StellarGlobe ref={globeRef} style={{ height: '100%' }} >
          {/* M31などの綺麗な画像 */}
          <PrettyPictures />

          {/* HSCの画像 */}
          <SspData baseUrl={sspDataUrl} />

          {/* 背景の天の川 */}
          <EsoMilkyWay />

          {/* 星 */}
          <HipparcosCatalog />

          {/* グリッド */}
          <Grid />

          {/* 星座 */}
          <Constellation lang='Hiragana' showNames />

          {/* XYZ軸 */}
          {showAxis && (<Path paths={axisPaths} />)}

          {/* Tract, Patch枠関係 */}
          {showTract && (<>
            {/* Tract選択肢 */}
            <TractSelector tractIds={tractIds} style={tractStyle} onClick={tractOnClick} />
            {
              selectedTractId !== undefined && (<>
                {/* Tractがどれか選択されていたら選択中のTractを強調表示 */}
                <Tract tractId={selectedTractId} color={selectedColor} />
                {/* Patch選択肢 */}
                <PatchSelector tractId={selectedTractId} style={tractStyle} onClick={patchOnClick} />
                {selectedPatchId !== undefined &&
                  // Patchがどれか選択されていたら選択中のPatchを強調表示
                  <Patch tractId={selectedTractId} patchId={selectedPatchId} color={selectedColor} />
                }
              </>)
            }
          </>)}
          {/* <GlobeDebug /> */}
        </StellarGlobe>
        {/* ビューワー関係はここまで */}
      </div>
      <div style={{ backgroundColor: '#eee', padding: '0.5em 1em', minWidth: '300px' }}>
        <dl>
          <dt>移動</dt>
          <dd>
            <ul>
              <li><button type="button" onClick={goM31}>M31</button></li>
              <li><button type="button" onClick={goAllSky}>全天</button></li>
              <li><button type="button" onClick={goTracts}>Tract枠</button></li>
            </ul>
          </dd>
          <dt>XYZ軸</dt>
          <dd>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label>
              <input type="checkbox" checked={showAxis} onChange={e => setShowAxis(e.target.checked)} />
              表示
            </label>
          </dd>
          <dt>Tract枠</dt>
          <dd>
            <ul style={{ listStyle: 'none' }}>
              <li>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label>
                  <input type="checkbox" checked={showTract} onChange={e => setShowTract(e.target.checked)} />
                  表示
                </label>
              </li>
              <li>選択中: {selectedTractId}/{selectedPatchId}</li>
            </ul>
          </dd>
          <dt>中心座標</dt>
          <dd>
            <pre style={{ whiteSpace: 'pre' }}>{centerCoord}</pre>
          </dd>
          <dt>
            クリック履歴&nbsp;
            {/* eslint-disable-next-line react/button-has-type */}
            <button onClick={() => setClickedHistory([])}>x</button>
          </dt>
          <dd>
            <ul>
              {clickedHistory.map((h, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <li key={i}><pre>{JSON.stringify(h, null, 2)}</pre></li>
              ))}
            </ul>
          </dd>
        </dl>
      </div>
    </div >
  )
}


export default React.memo(DataSelector)


function generageAxisPaths() {
  /** @type {path.Path[]} */
  const paths = [
    { // x軸
      points: [
        { position: [0, 0, 0], color: [1, 0, 0, 1], size: 0, },
        { position: [1, 0, 0], color: [1, 0, 0, 1], size: 0, },
      ], close: false, joint: path.JOINT.MITER,
    },
    { // y軸
      points: [
        { position: [0, 0, 0], color: [0, 1, 0, 1], size: 0, },
        { position: [0, 1, 0], color: [0, 1, 0, 1], size: 0, },
      ], close: false, joint: path.JOINT.MITER
    },
    { // z軸
      points: [
        { position: [0, 0, 0], color: [0, 0, 1, 1], size: 0, },
        { position: [0, 0, 1], color: [0, 0, 1, 1], size: 0, },
      ], close: false, joint: path.JOINT.MITER
    },
  ]
  return paths
}
