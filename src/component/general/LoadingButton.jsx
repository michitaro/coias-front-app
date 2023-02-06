import { React } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import PropTypes from 'prop-types';

function LoadingButton({
  loading,
  processName,
  showProgress,
  lastJsonMessage,
  fileUploadProgress,
}) {
  return (
    <Button
      type="button"
      style={{
        width: '100%',
        height: '100vh',
        position: 'fixed',
        zIndex: 100,
        backgroundColor: '#0000004f',
        top: 0,
        left: 0,
        display: loading ? 'block' : 'none',
        cursor: 'default',
      }}
    >
      <Spinner
        animation="border"
        style={{
          width: '50px',
          height: '50px',
        }}
      />
      <div id="current-process">{processName}</div>
      <div
        id="current-progress"
        style={{ display: showProgress ? 'block' : 'none' }}
      >
        {processName === 'アップロード中...'
          ? fileUploadProgress
          : lastJsonMessage && lastJsonMessage.progress}
      </div>
    </Button>
  );
}

LoadingButton.propTypes = {
  loading: PropTypes.bool.isRequired,
  processName: PropTypes.string.isRequired,
  showProgress: PropTypes.bool,
  lastJsonMessage: PropTypes.objectOf(PropTypes.string),
  fileUploadProgress: PropTypes.string.isRequired,
};

LoadingButton.defaultProps = {
  showProgress: false,
  lastJsonMessage: {},
};

export default LoadingButton;
