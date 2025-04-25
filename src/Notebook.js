import React, { useEffect, useState, useRef } from 'react';
import Page from './Page';
import pages from './pagesData';
import './Notebook.css';
import { getChatPageIndex  } from './pageNavigation';

export default function Notebook({ user }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [flipProgress, setFlipProgress] = useState(0);
  const [flipDirection, setFlipDirection] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [justSignedIn, setJustSignedIn] = useState(false);
  const [justSignedOut, setJustSignedOut] = useState(false);
  const [flippingFromSignIn, setFlippingFromSignIn] = useState(false);
  const [currentFriend, setCurrentFriend] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const startXRef = useRef(0);

  const handleFriendSelect = (friend) => {
    setCurrentFriend(friend);
    const roomId = generateRoomId(user.uid, friend.id);
    setCurrentPage(getChatPageIndex(pages, roomId)); 
  }

  const generateRoomId = (userId1, userId2) => {
    const sortedIds = [userId1, userId2].sort();
    return sortedIds.join('-');
  }

  const handleProfileToggle = () => {
    setIsFlipping(true);
    setFlipProgress(1);
    setTimeout(() => {
      setShowProfile(!showProfile);
      setFlipProgress(0);
      setIsFlipping(false);
    }, 500);
  };

  useEffect(() => {
    if(user) {
      setFlippingFromSignIn(true);
      setTimeout(() => {
        const spiral = document.querySelector('.spiral');
        if (spiral) spiral.classList.add('jiggle');
      }, 50);
      let progress = 0;
      const duration = 1000; // 1s animation
      const start = performance.now();

      const animate = (now) => {
        const elapsed = now - start;
        progress = Math.min(1, elapsed / duration);
        setFlipDirection('forward');
        setFlipProgress(progress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setTimeout(() => {
            setCurrentPage(0); // ensure it's on page 0
            setFlipProgress(0);
            setFlipDirection(null);
            setFlippingFromSignIn(false);
            document.querySelector('.spiral')?.classList.remove('jiggle');
          }, 1000);
        }
      };

      requestAnimationFrame(animate);
    }
    else {
      setJustSignedOut(true);
      setTimeout(() => setJustSignedOut(false), 1000); // Animation Time
    }
  }, [user]);

  const startDrag = (e, direction) => {
    if(!user || flippingFromSignIn) return;
    setIsDragging(true);
    setFlipDirection(direction);
    setFlipProgress(0);
    startXRef.current = e.clientX;
    e.target.setPointerCapture(e.pointerId);
  };

  const handleDrag = (e) => {
    if (!isDragging || !user || flippingFromSignIn) return;
    const deltaX = e.clientX - startXRef.current;
    const ratio = deltaX / 400;
    const progress = Math.min(1, Math.max(0, flipDirection === 'forward' ? -ratio : ratio));
    setFlipProgress(progress);
  };

  const endDrag = (e) => {
    if (!isDragging || !user) return;
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);

    if (flipProgress > 0.5) {
      setFlipProgress(1);
      setTimeout(() => {
        setCurrentPage((prev) =>
          flipDirection === 'forward'
            ? Math.min(prev + 2, pages.length - 2)
            : Math.max(prev - 2, 0)
        );
        setFlipProgress(0);
        setFlipDirection(null);
      }, 300);
    } 
    else {
      setFlipProgress(0);
      setFlipDirection(null);
    }
  };

  const leftIndex = currentPage;
  const rightIndex = currentPage + 1;

  return (
    <div className="notebook">
      <div className="spiral">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="spiral-ring"></div>
        ))}
      </div>

      {/* Only show left page if signed in */}
      {user && !flippingFromSignIn && (
        <Page
          side="left"
          className={justSignedIn ? 'slide-in' : justSignedOut ? 'slide-out' : ''}
          content={pages[leftIndex]}
          user={user}
          flipProgress={flipDirection === 'backward' ? flipProgress : 0}
          onPointerDown={(e) => startDrag(e, 'backward')}
          onPointerMove={handleDrag}
          onPointerUp={endDrag}
          onFriendSelect={handleFriendSelect}
        />
      )}
      <Page
        side="right"
        content={
          currentFriend 
                        ? { 
                            type: 'chat',
                            roomId: generateRoomId(user.uid, currentFriend.id),
                            friend: currentFriend 
                          }
                        : flippingFromSignIn
                            ? pages[rightIndex]
                            : user
                                ? pages[rightIndex]
                                : { type: 'signin' }
        }        
        user={user}
        currentFriend={currentFriend}
        flipProgress={flipDirection === 'forward' ? flipProgress : 0}
        flippingFromSignIn={flippingFromSignIn}
        onPointerDown={(e) => user && startDrag(e, 'forward')}
        onPointerMove={handleDrag}
        onPointerUp={endDrag}
      />
    </div>
  );
};
