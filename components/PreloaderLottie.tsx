'use client'

import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'

const LOTTIE_URL = 'https://cdn.lottielab.com/l/CHJ8Jay9BJqfpD.json'

export default function PreloaderLottie() {
  const [animData, setAnimData] = useState<object | null>(null)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    fetch(LOTTIE_URL)
      .then(r => r.json())
      .then(data => setAnimData(data))
      .catch(() => setHidden(true))
  }, [])

  if (hidden) return null

  return (
    <>
      <style>{`
        #preloader-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #f7ede2;
        }
        #preloader-lottie {
          width: 30vw;
        }
        @media (max-width: 1025px) {
          #preloader-lottie {
            width: 250px;
          }
        }
      `}</style>

      <div id="preloader-overlay">
        {animData && (
          <div id="preloader-lottie">
            <Lottie
              animationData={animData}
              loop={false}
              autoplay={true}
              onComplete={() => setHidden(true)}
            />
          </div>
        )}
      </div>
    </>
  )
}
