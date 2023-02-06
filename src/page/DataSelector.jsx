/*
 * 画像選択モード
 *
 */
import PropTypes from 'prop-types';
import axios from 'axios';
import React, {
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
  useContext,
} from 'react';
import {
  Button,
  ButtonGroup,
  Col,
  Dropdown,
  DropdownButton,
  Row,
} from 'react-bootstrap';
import { BiHelpCircle } from 'react-icons/bi';
import { AiFillSetting } from 'react-icons/ai';
/* eslint-disable no-unused-vars */
import { angle, easing, Globe, SkyCoord } from '@stellar-globe/stellar-globe';
/* eslint-disable no-unused-vars */
/* eslint-disable import/no-unresolved, import/extensions, no-unused-vars */
import {
  CelestialText,
  Constellation,
  Ecliptic,
  Equatorial,
  EsoMilkyWay,
  HipparcosCatalog,
  Patch,
  PatchSelector,
  RingsTract,
  SspData,
  SspOutline,
  StellarGlobe,
  Tract,
  TractSelector,
  PrettyPictures,
} from '../component/StellarGlobe';
/* eslint-disable import/no-unresolved, import/extensions, no-unused-vars */
import CONSTANT from '../utils/CONSTANTS';
import SelectDateModal from '../component/StellarGlobe/SelectDateModal';
import SelectImageModal from '../component/StellarGlobe/SelectImageModal';
import AutoSelectResultModal from '../component/StellarGlobe/AutoSelectResultModal';
import StellarGlobeSettingModal from '../component/StellarGlobe/StellarGlobeSettingModal';
import StellarGlobeHelpModal from '../component/StellarGlobe/StellarGlobeHelpModal';
import ColorLegend from '../component/StellarGlobe/ColorLegend';
import { ModeStatusContext } from '../component/functional/context';

function DataSelector({ setFileNames }) {
  // ---変数-----------------------------------------------
  const reactApiUri = process.env.REACT_APP_API_URI;
  const { setModeStatus } = useContext(ModeStatusContext);
  useEffect(() => {
    setModeStatus({
      ExplorePrepare: false,
      COIAS: false,
      Manual: false,
      Report: false,
      FinalCheck: false,
    });
  }, []);

  const globeRef = useRef(null);
  /** @type { () => Globe } */
  const globe = () => globeRef.current.globe();

  const [helpModalShow, setHelpModalShow] = useState(false);
  const [settingModalShow, setSettingModalShow] = useState(false);
  const [selectMultipleDates, setSelectMultipleDates] = useState(false);
  const [selectImageMode, setSelectImageMode] = useState(true);
  const [selectDateModalShow, setSelectDateModalShow] = useState(false);
  const [selectImageModalShow, setSelectImageModalShow] = useState(false);
  const [fileSelectState, setFileSelectState] = useState('未選択');
  const [images, setImages] = useState([]);
  const [tracts, setTracts] = useState([]);
  const [validPatchIds, setValidPatchIds] = useState([]);
  const [validPatchProgresses, setValidPatchProgresses] = useState([]);
  const [observedDates, setObservedDates] = useState({});
  const [selectedTractId, setSelectedTractId] = useState(undefined);
  const [selectedPatchId, setSelectedPatchId] = useState(undefined);
  const [selectedDateIds, setSelectedDateIds] = useState(undefined);
  const [autoSelectResult, setAutoSelectResult] = useState({});
  const [showAutoSelectResult, setShowAutoSelectResult] = useState(false);
  const ringsTract = new RingsTract();

  // ---tract・patchの色関係の定義--------------------------------------------------
  const TRACT_PATCH_COLORS = [
    {
      color: [1, 0, 0],
      comment: '未解析',
    },
    { color: [1, 0.65, 0], comment: '解析率中' },
    { color: [1, 1, 0], comment: '解析率大' },
    { color: [0, 1, 0], comment: '解析完了' },
    { color: [0, 1, 1], comment: '選択中' },
  ];

  // デフォルト色
  const defaultStyle = useMemo(
    () => ({
      baseColor: [1, 0, 0, 1],
      hoverColor: [1, 0, 0, 1],
      activeColor: [1, 0, 0, 1],
      baseFillColor: [1, 0, 0, 1],
    }),
    [],
  );

  // 選択された時の色
  const selectedStyle = useMemo(
    () => ({
      baseColor: TRACT_PATCH_COLORS[4].color.concat([1]),
      baseFillColor: TRACT_PATCH_COLORS[4].color.concat([0.5]),
    }),
    [],
  );

  // tract・patchごとの進捗率に依存した色
  const proggressDependentStyle = (tmpProgress) => {
    let color;
    if (tmpProgress < 0.33) {
      color = TRACT_PATCH_COLORS[0].color;
    } else if (tmpProgress < 0.66) {
      color = TRACT_PATCH_COLORS[1].color;
    } else if (tmpProgress < 0.99) {
      color = TRACT_PATCH_COLORS[2].color;
    } else {
      color = TRACT_PATCH_COLORS[3].color;
    }
    const style = {
      ...defaultStyle,
      baseColor: color.concat([1]),
      hoverColor: color.concat([1]),
      baseFillColor: color.concat([0.5]),
    };
    return style;
  };

  useEffect(async () => {
    const res = await axios.get(`${reactApiUri}tract_list`).catch(() => {
      console.log('tract情報のロード時にエラーが発生しました');
    });
    if (res !== undefined) {
      setTracts(
        Object.keys(res.data.result).map((key) => {
          const tractId = parseInt(key, 10);
          const { progress } = res.data.result[key];
          /** @type {import('../../component/StellarGlobe/TractPatch').TractSelectorTract} */
          const tractDef = {
            id: tractId,
            style: proggressDependentStyle(progress),
          };
          return tractDef;
        }),
      );
    }
  }, []);

  const progressColoredPatch = useMemo(() => {
    /** @type {import('../../component/StellarGlobe/TractPatch').PatchSelectorProps["patchStyle"]} */
    const patchStyle = {};
    validPatchProgresses.forEach((validPatchProgress) => {
      const { progress } = validPatchProgress;
      patchStyle[validPatchProgress.patchIdStr] =
        proggressDependentStyle(progress);
    });
    return patchStyle;
  }, [validPatchProgresses]);

  // eslint-disable-next-line no-unused-vars
  const sspDataUrl = useMemo(() => {
    const ssl = window.location.protocol === 'https';
    return `${
      ssl ? 'https' : 'http'
    }://hscmap.mtk.nao.ac.jp/hscMap4/data/pdr3_wide`;
  }, []);
  // ----------------------------------------------------------------------------

  const REGION_NAMES = ['', '画像領域1', '画像領域2', '画像領域3'];
  // 文字を配置
  /** @type {import('../../component/StellarGlobe/layers').CelestialTextProps} */
  const textProp = useMemo(() => {
    const textArray = [
      {
        position: SkyCoord.fromDeg(90, 23.4).xyz,
        text: '黄道',
        color: 'orange',
      },
    ];
    if (selectImageMode) {
      textArray.push({
        position: SkyCoord.fromDeg(5, 10).xyz,
        text: REGION_NAMES[1],
        color: 'cyan',
        font: '35px serif',
      });
      textArray.push({
        position: SkyCoord.fromDeg(177, 10).xyz,
        text: REGION_NAMES[2],
        color: 'cyan',
        font: '35px serif',
      });
      textArray.push({
        position: SkyCoord.fromDeg(225, 48).xyz,
        text: REGION_NAMES[3],
        color: 'cyan',
        font: '35px serif',
      });
    } else {
      textArray.push({
        position: SkyCoord.fromDeg(90, 0).xyz,
        text: '赤道',
        color: 'red',
      });
      textArray.push({
        position: SkyCoord.fromDeg(0, 90).xyz,
        text: '天の北極',
      });
      textArray.push({
        position: SkyCoord.fromDeg(0, 0).xyz,
        text: '春分点',
        color: 'fuchsia',
      });
      textArray.push({
        position: SkyCoord.fromDeg(180, 0).xyz,
        text: '秋分点',
        color: 'crimson',
      });
      textArray.push({
        position: SkyCoord.fromDeg(0, -90).xyz,
        text: '天の南極',
      });
    }
    const textObject = {
      billboardTexts: textArray,
      defaultColor: 'white',
      defaultFont: '25px serif', // https://developer.mozilla.org/ja/docs/Web/CSS/font の書式で
      alpha: 1, // 不透明度
    };
    return textObject;
  }, [selectImageMode]);

  // 鑑賞モードの天体一覧の定義
  const BEAUTIFUL_OBJECTS = {
    objectsInOurGalaxy: [
      {
        name: 'プレアデス星団 (M45、和名「すばる」)',
        coord: '03:47:00 +24:07:05',
        fovyDeg: 0.5,
      },
      {
        name: 'オリオン星雲 (M42)',
        coord: '05:35:17 -05:23:28',
        fovyDeg: 0.5,
      },
    ],
    galaxies: [
      {
        name: 'アンドロメダ銀河 (M31)',
        coord: '00:42:44 +41:16:9',
        fovyDeg: 0.5,
      },
      {
        name: '矮小銀河 KKR25',
        coord: '16:13:48 +54:22:16',
        fovyDeg: 1,
      },
      {
        name: '渦巻銀河 M101',
        coord: '14:03:13 +54:20:56',
        fovyDeg: 0.3,
      },
      {
        name: 'おたまじゃくし銀河 (UGC 10214)',
        coord: '16:06:03.9 +55:25:32',
        fovyDeg: 1,
      },
      {
        name: '衝突銀河 UGC 12589 & 2MASX J23250382+0001068',
        coord: '23:25:01.7 +00:00:01.9',
        fovyDeg: 0.03,
      },
      {
        name: '衝突銀河 2MASX J16270254+4328340',
        coord: '16:27:02.5 +43:28:34.1',
        fovyDeg: 0.03,
      },
      {
        name: '衝突銀河 LEDA 2535615 & LEDA 2535506',
        coord: '16:14:53.4 +56:24:08.8',
        fovyDeg: 1,
      },
      {
        name: '衝突銀河 NGC 7667',
        coord: '23:24:22.8 -00:06:30.2',
        fovyDeg: 0.03,
      },
      {
        name: '衝突銀河 UGC 9327 & FIRST J143043.0+001510',
        coord: '14:30:43.0 +00:15:10.7',
        fovyDeg: 0.03,
      },
    ],
    gravityLens: [
      {
        name: 'ホルスの目',
        coord: '14:24:49 -00:53:22',
        fovyDeg: 0.0075,
      },
      {
        name: '重力レンズ SDSS J115214.19+003126.5',
        coord: '11:52:14.19 +00:31:26.5',
        fovyDeg: 0.03,
      },
      {
        name: '重力レンズ NVSS J142016+005718',
        coord: '14:20:16.6 +00:57:19',
        fovyDeg: 0.03,
      },
      {
        name: '重力レンズ 2SLAQ J144132.67-005358.3',
        coord: '14:41:32.67 -00:53:58.3',
        fovyDeg: 0.03,
      },
      {
        name: '重力レンズ PMN J2329-0121',
        coord: '23:29:47.9 -01:20:49',
        fovyDeg: 0.01,
      },
    ],
    galaxyCluster: [
      {
        name: 'ペルセウス座銀河団',
        coord: '03:19:47.2 +41:30:47',
        fovyDeg: 0.5,
      },
    ],
  };
  // ----------------------------------------------------

  // ---コールバック関数------------------------------------
  // 選択画像名一覧をプロジェクトディレクトリに書き出す
  const putImageNamesToProjectDir = useCallback(
    async (tmpSelectedImageNames) => {
      // プロジェクト(カレント)ディレクトリを作るだけで画像のアップロードはしない
      await axios.post(`${reactApiUri}uploadfiles`).catch(() => {});
      // プロジェクト(カレント)ディレクトリに解析画像一覧を記したテキストファイルを生成する
      await axios
        .put(`${reactApiUri}put_image_list`, tmpSelectedImageNames)
        .catch(() => {});
    },
    [],
  );

  // tractIdを受け取り, そのtract内のpatch一覧を取得しセットする
  const getAndSetValidPatchIds = useCallback(async (tmpTractId) => {
    const res = await axios
      .get(`${reactApiUri}patch_list?tractId=${tmpTractId}`)
      .catch(() => {
        console.log('patch情報のロード時にエラーが発生しました');
      });
    if (res !== undefined) {
      setValidPatchIds(
        Object.keys(res.data.result).map((tractPatchStr) => {
          const patchIdStr = tractPatchStr.split('-')[1];
          const patchIdStrSplitted = patchIdStr.split(',');
          const j = parseInt(patchIdStrSplitted[0], 10);
          const i = parseInt(patchIdStrSplitted[1], 10);
          return [j, i];
        }),
      );
      setValidPatchProgresses(
        Object.keys(res.data.result).map((tractPatchStr) => {
          const patchIdStr = tractPatchStr.split('-')[1];
          const { progress } = res.data.result[tractPatchStr];
          return { patchIdStr, progress };
        }),
      );
    }
  }, []);

  // 画像領域1へカメラ移動
  const goRegion1 = useCallback(() => {
    globe().camera.jumpTo(
      {
        fovy: angle.deg2rad(25), // 画角 (radian)
      },
      {
        coord: SkyCoord.fromDeg(5, 0), // 移動先座標
        duration: 400, // 移動時間
        easingFunction: easing.fastStart4, // 移動easing関数
      },
    );
  }, []);

  // 画像領域2へカメラ移動
  const goRegion2 = useCallback(() => {
    globe().camera.jumpTo(
      {
        fovy: angle.deg2rad(35), // 画角 (radian)
      },
      {
        coord: SkyCoord.fromDeg(177, 0), // 移動先座標
        duration: 400, // 移動時間
        easingFunction: easing.fastStart4, // 移動easing関数
      },
    );
  }, []);

  // 画像領域3へカメラ移動
  const goRegion3 = useCallback(() => {
    globe().camera.jumpTo(
      {
        fovy: angle.deg2rad(15), // 画角 (radian)
      },
      {
        coord: SkyCoord.fromDeg(225, 45), // 移動先座標
        duration: 400, // 移動時間
        easingFunction: easing.fastStart4, // 移動easing関数
      },
    );
  }, []);

  // 受け取ったオブジェクトへカメラ移動
  const goThisObject = useCallback((thisObject) => {
    globe().camera.jumpTo(
      {
        fovy: angle.deg2rad(thisObject.fovyDeg), // 画角 (radian)
      },
      {
        coord: SkyCoord.parse(thisObject.coord), // 移動先座標
        duration: 400, // 移動時間
        easingFunction: easing.fastStart4, // 移動easing関数
      },
    );
  }, []);

  // 全天モードにカメラを移動
  const goAllSky = useCallback(() => {
    globe().camera.jumpTo(
      {
        fovy: 1,
      },
      {
        coord: SkyCoord.fromDeg(0, 0), // 移動先座標 赤経0度、赤緯0度
      },
    );
  }, []);

  const tractOnClick = useCallback(async (tractIndex) => {
    setSelectedTractId(tractIndex);
    setSelectedPatchId(undefined);

    const [a, d] = ringsTract.index2ad(tractIndex);
    globe().camera.jumpTo(
      {
        fovy: angle.deg2rad(1),
      },
      {
        coord: SkyCoord.fromRad(a, d),
        duration: 400,
        easingFunction: easing.fastStart4,
      },
    );
    getAndSetValidPatchIds(tractIndex);
  }, []);

  const patchOnClick = useCallback(
    async (patchId) => {
      setSelectedPatchId(patchId);
      const tractPatchStr = `${selectedTractId}-${patchId}`;
      const res = await axios
        .get(`${reactApiUri}observe_date_list?patchId=${tractPatchStr}`)
        .catch(() => {
          console.log('観測日情報のロード時にエラーが発生しました');
        });
      if (res !== undefined) {
        const pairs = Object.entries(res.data.result);
        pairs.sort((p1, p2) => {
          const p1Key = p1[0];
          const p2Key = p2[0];
          if (p1Key < p2Key) {
            return -1;
          }
          if (p1Key > p2Key) {
            return 1;
          }
          return 0;
        });
        const sortedDates = Object.fromEntries(pairs);
        Object.keys(sortedDates).forEach((key) => {
          sortedDates[key].isSelected = false;
        });

        setObservedDates(sortedDates);
        setSelectedDateIds(undefined);
        setSelectDateModalShow(true);
      }
    },
    [selectedTractId],
  );

  const dateOnClick = useCallback(async (dateIds) => {
    const dateIdsListStr = dateIds.map((dateId) => String(dateId));
    const dateIdsStr = dateIdsListStr.join('-');
    const res = await axios
      .get(`${reactApiUri}image_list?dirIdsStr=${dateIdsStr}`)
      .catch(() => {
        console.log('画像情報のロード時にエラーが発生しました');
      });
    if (res !== undefined) {
      const pairs = Object.entries(res.data.result);
      pairs.sort((p1, p2) => {
        const p1Key = p1[0];
        const p2Key = p2[0];

        const p1Visit = parseInt(p1Key.split(/-|\./)[5], 10);
        const p2Visit = parseInt(p2Key.split(/-|\./)[5], 10);

        if (p1Visit < p2Visit) {
          return -1;
        }
        if (p1Visit > p2Visit) {
          return 1;
        }
        return 0;
      });
      const sortedImages = Object.fromEntries(pairs);
      Object.keys(sortedImages).forEach((key) => {
        sortedImages[key].isSelected = false;
      });

      setImages(sortedImages);
      setSelectImageModalShow(true);
    }
  }, []);

  const imageOnClick = useCallback(async (callBackImages) => {
    let NSelectedImages = 0;
    const tmpSelectedImageNames = [];
    Object.keys(callBackImages).forEach((key) => {
      if (callBackImages[key].isSelected) {
        NSelectedImages += 1;
        tmpSelectedImageNames.push(key);
      }
    });
    setFileSelectState(`${NSelectedImages}枚選択中`);
    setFileNames(tmpSelectedImageNames);
    setModeStatus((prevModeStatus) => {
      const modeStatusCopy = { ...prevModeStatus };
      modeStatusCopy.ExplorePrepare = true;
      return modeStatusCopy;
    });
    putImageNamesToProjectDir(tmpSelectedImageNames);
  }, []);

  const autoSelect = useCallback(async () => {
    const res = await axios.get(`${reactApiUri}suggested_images`).catch(() => {
      console.log('自動画像選択情報のロード時にエラーが発生しました');
    });

    if (res !== undefined) {
      const resResult = res.data.result;
      let regionName;
      if (resResult.dec > 30) {
        [, , , regionName] = REGION_NAMES;
      } else if (resResult.ra > 120 && resResult.ra < 240) {
        [, , regionName] = REGION_NAMES;
      } else {
        [, regionName] = REGION_NAMES;
      }
      const tmpTractId = parseInt(resResult.tractPatch.split('-')[0], 10);
      const tmpPatchId = resResult.tractPatch.split('-')[1];
      setSelectedTractId(tmpTractId);
      setSelectedPatchId(tmpPatchId);
      const [a, d] = ringsTract.index2ad(tmpTractId);
      globe().camera.jumpTo(
        {
          fovy: angle.deg2rad(1),
        },
        {
          coord: SkyCoord.fromRad(a, d),
          duration: 400,
          easingFunction: easing.fastStart4,
        },
      );
      getAndSetValidPatchIds(tmpTractId);

      resResult.regionName = regionName;
      setAutoSelectResult(resResult);
      setShowAutoSelectResult(true);

      setFileSelectState(`${resResult.fileNames.length}枚選択中`);
      setFileNames(resResult.fileNames);
      setModeStatus((prevModeStatus) => {
        const modeStatusCopy = { ...prevModeStatus };
        modeStatusCopy.ExplorePrepare = true;
        return modeStatusCopy;
      });
      putImageNamesToProjectDir(resResult.fileNames);
    }
  }, []);

  const clearImageSelect = () => {
    setFileSelectState('未選択');
    setSelectedTractId(undefined);
    setSelectedPatchId(undefined);
    setSelectedDateIds(undefined);
    setFileNames([]);
    goRegion1();
    setModeStatus((prevModeStatus) => {
      const modeStatusCopy = { ...prevModeStatus };
      modeStatusCopy.ExplorePrepare = false;
      return modeStatusCopy;
    });
  };
  // ----------------------------------------------------

  return (
    <div style={{ flexGrow: 1 }}>
      <Row style={{ margin: '10px' }}>
        <Col>
          <h4>移動:</h4>
        </Col>
        {selectImageMode ? (
          <>
            {/* 画像選択モード */}
            <Col>
              <Button onClick={goRegion1} className="btn-style box_blue">
                領域1
              </Button>
            </Col>
            <Col>
              <Button onClick={goRegion2} className="btn-style box_blue">
                領域2
              </Button>
            </Col>
            <Col>
              <Button onClick={goRegion3} className="btn-style box_blue">
                領域3
              </Button>
            </Col>
            <Col>
              <h4>画像選択状況:</h4>
            </Col>
            <Col>
              <h4>{fileSelectState}</h4>
            </Col>
            <Col>
              <Button
                onClick={clearImageSelect}
                className="btn-style box_blue justify-content-end"
                disabled={fileSelectState === '未選択'}
              >
                画像選択クリア
              </Button>
            </Col>
            <Col>
              <Button
                onClick={autoSelect}
                className="btn-style box_blue justify-content-end"
              >
                自動選択
              </Button>
            </Col>
            {/* 画像選択モードここまで */}
          </>
        ) : (
          <>
            {/* 鑑賞モード */}
            <Col>
              <Button onClick={goAllSky}>全天に戻る</Button>
            </Col>
            <Col>
              <DropdownButton as={ButtonGroup} title="銀河系内天体">
                {BEAUTIFUL_OBJECTS.objectsInOurGalaxy.map((item, index) => (
                  <Dropdown.Item
                    eventKey={index}
                    onClick={() => {
                      goThisObject(item);
                    }}
                  >
                    {item.name}
                  </Dropdown.Item>
                ))}
              </DropdownButton>
            </Col>
            <Col>
              <DropdownButton as={ButtonGroup} title="銀河">
                {BEAUTIFUL_OBJECTS.galaxies.map((item, index) => (
                  <Dropdown.Item
                    eventKey={index}
                    onClick={() => {
                      goThisObject(item);
                    }}
                  >
                    {item.name}
                  </Dropdown.Item>
                ))}
              </DropdownButton>
            </Col>
            <Col>
              <DropdownButton as={ButtonGroup} title="重力レンズ天体">
                {BEAUTIFUL_OBJECTS.gravityLens.map((item, index) => (
                  <Dropdown.Item
                    eventKey={index}
                    onClick={() => {
                      goThisObject(item);
                    }}
                  >
                    {item.name}
                  </Dropdown.Item>
                ))}
              </DropdownButton>
            </Col>
            <Col>
              <DropdownButton as={ButtonGroup} title="銀河団">
                {BEAUTIFUL_OBJECTS.galaxyCluster.map((item, index) => (
                  <Dropdown.Item
                    eventKey={index}
                    onClick={() => {
                      goThisObject(item);
                    }}
                  >
                    {item.name}
                  </Dropdown.Item>
                ))}
              </DropdownButton>
            </Col>
            {/* 鑑賞モードここまで */}
          </>
        )}
        <Col>
          <Button variant="light" onClick={() => setSettingModalShow(true)}>
            <AiFillSetting size={CONSTANT.iconSize} className="icon-color" />
          </Button>
        </Col>
        <Col>
          <Button variant="light" onClick={() => setHelpModalShow(true)}>
            <BiHelpCircle size={CONSTANT.iconSize} className="icon-color" />
          </Button>
        </Col>
      </Row>
      <Row>
        {/* ビューワー関係はここから */}
        <StellarGlobe ref={globeRef}>
          {/* M31などの綺麗な画像 */}
          <PrettyPictures />

          {/* HSCの画像 */}
          <SspData baseUrl={sspDataUrl} outline={false} />

          {/* 背景の天の川 */}
          <EsoMilkyWay />

          {/* 星 */}
          <HipparcosCatalog />

          {/* 星座 */}
          <Constellation lang="Hiragana" showNames />

          {/* 黄道 */}
          <Ecliptic />

          {/* 文字 */}
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <CelestialText {...textProp} />

          {selectImageMode ? (
            <>
              {/* HSCの画像データの枠 */}
              <SspOutline
                url="//hscmap.mtk.nao.ac.jp/hscMap4/data/pdr3_wide/area.json"
                color={[0, 1, 1, 0.5]}
              />

              {/* Tract, Patch枠関係 */}
              {/* Tract選択肢 */}
              <TractSelector tracts={tracts} onClick={tractOnClick} />
              {selectedTractId !== undefined && (
                <>
                  {/* Tractがどれか選択されていたら選択中のTractを強調表示 */}
                  <Tract
                    tractId={selectedTractId}
                    style={selectedStyle}
                    baseLineWidth={15}
                  />
                  {/* Patch選択肢 */}
                  <PatchSelector
                    tractId={selectedTractId}
                    defaultStyle={defaultStyle}
                    patchStyle={progressColoredPatch}
                    validPatchIds={validPatchIds}
                    onClick={patchOnClick}
                  />
                  {selectedPatchId !== undefined && (
                    // Patchがどれか選択されていたら選択中のPatchを強調表示
                    <Patch
                      tractId={selectedTractId}
                      patchId={selectedPatchId}
                      style={selectedStyle}
                    />
                  )}
                </>
              )}

              {/* 凡例 */}
              <ColorLegend TRACT_PATCH_COLORS={TRACT_PATCH_COLORS} />
            </>
          ) : (
            <>
              {/* 赤道 */}
              <Equatorial />
            </>
          )}
        </StellarGlobe>
        {/* ビューワー関係はここまで */}
      </Row>

      <SelectDateModal
        show={selectDateModalShow}
        onExit={() => {
          setSelectDateModalShow(false);
        }}
        onClickOkButton={dateOnClick}
        observedDates={observedDates}
        setObservedDates={setObservedDates}
        selectedDateIds={selectedDateIds}
        setSelectedDateIds={setSelectedDateIds}
        selectMultipleDates={selectMultipleDates}
      />

      <SelectImageModal
        show={selectImageModalShow}
        onExit={() => {
          setSelectImageModalShow(false);
        }}
        onClickOkButton={imageOnClick}
        images={images}
        setImages={setImages}
      />

      <AutoSelectResultModal
        show={showAutoSelectResult}
        onExit={() => {
          setShowAutoSelectResult(false);
        }}
        autoSelectResult={autoSelectResult}
      />

      <StellarGlobeSettingModal
        show={settingModalShow}
        onHide={() => {
          setSettingModalShow(false);
        }}
        selectMultipleDates={selectMultipleDates}
        setSelectMultipleDates={setSelectMultipleDates}
        selectImageMode={selectImageMode}
        setSelectImageMode={setSelectImageMode}
        title="設定"
      />

      <StellarGlobeHelpModal
        show={helpModalShow}
        onHide={() => {
          setHelpModalShow(false);
        }}
        title="ヘルプ"
      />
    </div>
  );
}

export default DataSelector;

DataSelector.propTypes = {
  setFileNames: PropTypes.func.isRequired,
};
