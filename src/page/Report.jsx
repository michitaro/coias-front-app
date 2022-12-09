import axios from 'axios';
import React, { useEffect, useState, useContext } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import AlertModal from '../component/general/AlertModal';
import ErrorModal from '../component/general/ErrorModal';
import LoadingButton from '../component/general/LoadingButton';
import GetProgress from '../component/general/GetProgress';
import { ModeStatusContext } from '../component/functional/context';

function Report() {
  const reactApiUri = process.env.REACT_APP_API_URI;

  const [sendMpcMEA, setSendMpcMEA] = useState('');
  const [sendMpcBody, setSendMpcBody] = useState([]);
  const [sendMpc, setSendMpc] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showProcessError, setShowProcessError] = useState(false);
  const [errorPlace, setErrorPlace] = useState('');
  const [errorReason, setErrorReason] = useState('');

  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState('');
  const { modeStatus, setModeStatus } = useContext(ModeStatusContext);

  const makeSendMpc = async () => {
    const header = [
      'COD 568',
      'CON S. Urakawa, Bisei Spaceguard Center, 1716-3, Okura, Bisei',
      'CON Ibara, 714-1411 Okayama, Japan [urakawa@spaceguard.or.jp]',
      `OBS H. Aihara, Y. AlSayyad, M. Ando, R. Armstrong, J. Bosch, E. Egami,`,
      `H. Furusawa, J. Furusawa, S. Harasawa, Y. Harikane, B-H, Hsieh, H. Ikeda,`,
      `K. Ito, I. Iwata, T. Kodama, M. Koike, M. Kokubo, Y. Komiyama, X. Li, Y. Liang,`,
      `Y-T. Lin, R. H. Lupton, N. B. Lust, L. A. MacArthur, K. Mawatari, S. Mineo,`,
      `H. Miyatake, S. Miyazaki, S. More, T. Morishima, H. Murayama, K. Nakajima,`,
      `F. Nakata, A. J. Nishizawa, M. Oguri, N. Okabe, Y. Okura, Y. Ono, K. Osato,`,
      `M. Ouchi, Y-C. Pan, A. A. Plazas Malagón, P. A. Price, S. L. Reed,`,
      `E. S. Rykoff, T. Shibuya, M. Simunovic, M. A. Strauss, K. Sugimori, Y. Suto,`,
      `N. Suzuki, M. Takada, Y. Takagi, T. Takata, S. Takita, M. Tanaka, S. Tang,`,
      `D. S. Taranu, T. Terai, Y. Toba, E. L. Turner, H. Uchiyama,`,
      `B. Vijarnwannaluk, C. Z. Waters, Y. Yamada, N. Yamamoto, T. Yamashita`,
      `MEA ${sendMpcMEA}`,
      'TEL 8.2-m f/2.0 reflector + CCD(HSC)',
      'NET Pan-STARRS(PS1) DR1 catalog',
      'ACK Subaru/HSC',
    ];

    await setSendMpc(header.concat(sendMpcBody));
  };

  const downloadFIle = () => {
    if (sendMpcBody[0] === '') {
      setErrorPlace('sendMpcのダウンロード');
      setErrorReason('sendMpc.txtが空です');
      setShowProcessError(true);
      return;
    }
    const element = document.createElement('a');
    const file = new Blob(
      sendMpc.map((item) => `${item}\n`),
      {
        type: 'text/plain',
      },
    );
    element.href = URL.createObjectURL(file);
    element.download = 'send_mpc.txt';
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  const getMpc = async () => {
    setLoading(true);
    setShowProgress(true);
    setProgress('0%');
    const timerID = setInterval(
      () => GetProgress(setProgress, 'AstsearchR_afterReCOIAS'),
      250,
    );

    await axios
      .put(
        modeStatus.FinalCheck
          ? `${reactApiUri}get_mpc`
          : `${reactApiUri}AstsearchR_afterReCOIAS`,
      )
      .then((response) => {
        const mpctext = response.data.send_mpc;
        const result = mpctext.split('\n');
        setSendMpcBody(
          result.map((item) => {
            const trimedStr = item.trim();
            const splitStr = trimedStr.split(' ');
            if (splitStr[0].length >= 7) {
              return `\u00A0\u00A0\u00A0\u00A0\u00A0${trimedStr}`;
            }
            return trimedStr;
          }),
        );
        setLoading(false);
        clearInterval(timerID);
        setModeStatus((prevModeStatus) => {
          const modeStatusCopy = { ...prevModeStatus };
          modeStatusCopy.FinalCheck = true;
          return modeStatusCopy;
        });
      })
      .catch((e) => {
        const errorResponse = e.response?.data?.detail;
        if (errorResponse.place) {
          setErrorPlace(errorResponse.place);
          setErrorReason(errorResponse.reason);
          setShowProcessError(true);
        }
        setLoading(false);
        clearInterval(timerID);
      });
  };

  const downloadFinalAllFIle = async () => {
    await axios
      .get(`${reactApiUri}final_all`)
      .then((response) => response.data.finalall)
      .then((finalall) => {
        const finalAllArray = finalall.split('\n');
        const element = document.createElement('a');
        const file = new Blob(
          finalAllArray.map((content) => `${content}\n`),
          {
            type: 'text/plain',
          },
        );
        element.href = URL.createObjectURL(file);
        element.download = 'final_all.txt';
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
      })
      .catch(() => {
        setLoading(false);
        setShowError(true);
        setErrorMessage('final_all.txtがありません');
      });
  };

  // 初回のみのAPIの読み込み
  useEffect(() => {
    getMpc();
  }, []);

  useEffect(() => {
    makeSendMpc();
  }, [sendMpcMEA, sendMpcBody]);

  return (
    <div>
      <Form>
        <Form.Group className="p-3 w-76">
          <Row xs="auto">
            <Col md={1}>
              <h4>OBS </h4>
            </Col>
            <Col md={10} style={{ marginLeft: '10px' }}>
              <Form.Control
                placeholder="観測者名: default = HSC observers (変更したい場合はsend_mpc.txtをダウンロードした後に直接編集してください)"
                disabled
              />
            </Col>
          </Row>
        </Form.Group>
        <Form.Group className="p-3 w-76">
          <Row xs="auto">
            <Col md={1}>
              <h4>MEA </h4>
            </Col>
            <Col md={10} style={{ marginLeft: '10px' }}>
              <Form.Control
                placeholder="測定者(ご自身)のお名前を記入してください. 複数の場合はカンマ区切りで記入してください. (例) Y. Endo, M. Konohata, A. Manaka"
                onChange={(e) => {
                  setSendMpcMEA(e.target.value);
                }}
              />
            </Col>
          </Row>
        </Form.Group>
      </Form>
      <Row xs="auto" className="mt-3">
        <Col>
          <h4 style={{ marginLeft: '13px' }}>レポート </h4>
        </Col>
        <Col md={8}>
          <div
            style={{
              marginLeft: '10px',
              backgroundColor: 'black',
              height: '61vh',
              overflow: 'scroll',
            }}
          >
            <ul id="send-mpc" style={{ listStyleType: 'none', color: 'white' }}>
              {sendMpc.length > 0 &&
                sendMpc.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </Col>
      </Row>
      <Row className="d-flex ">
        <Col>
          <Button
            variant="primary"
            onClick={() => {
              getMpc();
            }}
            className="mt-3"
            style={{ marginLeft: '144px' }}
          >
            レポート作成をやり直す
          </Button>
        </Col>
        <Col md={4} style={{ marginRight: '222px' }}>
          <Button
            variant="primary"
            onClick={() => {
              downloadFIle();
            }}
            className="mt-3"
          >
            Download send_mpc
          </Button>

          <Button
            variant="primary"
            onClick={() => {
              downloadFinalAllFIle();
            }}
            className="mt-3"
            style={{ marginLeft: '10px' }}
          >
            Download final_all
          </Button>
        </Col>
      </Row>
      <LoadingButton
        loading={loading}
        processName="レポートデータ取得中…"
        showProgress={showProgress}
        progress={progress}
      />
      <AlertModal
        alertModalShow={showError}
        onClickOk={() => {
          setShowError(false);
        }}
        alertMessage={errorMessage}
        alertButtonMessage="はい"
      />
      <ErrorModal
        show={showProcessError}
        setShow={setShowProcessError}
        errorPlace={errorPlace}
        errorReason={errorReason}
        setLoading={setLoading}
      />
    </div>
  );
}

export default Report;
