import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toEmbedUrl } from '../lib/videoUtils';
import { Calendar, ArrowRight, Award, GraduationCap, Megaphone, Newspaper, Play, X } from 'lucide-react';
import HeroWaveBackground from '../components/HeroWaveBackground';
import welcomeImg from '../assets/imgs/welcome.png';
import makingImg from '../assets/imgs/making.png';
import tatakrectoImg from '../assets/imgs/tatakrecto.png';
import speechlabImg from '../assets/imgs/speechlab.png';
import comlabImg from '../assets/imgs/comlabG11-4.png';
import coveredcourtImg from '../assets/imgs/coveredcourt.jpg';
import mapehImg from '../assets/imgs/mapeh.png';
import schoolmapImg from '../assets/imgs/schoolmap.png';

const Home = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [announcementPage, setAnnouncementPage] = useState(1);
  const [newsPage, setNewsPage] = useState(1);
  const [featuredVideos, setFeaturedVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedPostType, setSelectedPostType] = useState('');
  const [showAllFacilities, setShowAllFacilities] = useState(false);
  
  const slides = [welcomeImg, makingImg, tatakrectoImg];
  const itemsPerPage = 6;
  const facilities = [
    {
      title: 'Music Room',
      description: 'Creative space for music classes, practice sessions, and performance preparation.',
      image: mapehImg,
      spanClass: 'lg:col-span-5',
    },
    {
      title: 'ICT Computer Laboratory',
      description: 'Computer laboratory supporting digital literacy, research, and technology-enabled lessons.',
      image: comlabImg,
      spanClass: 'lg:col-span-7',
    },
    {
      title: 'Covered Court',
      description: 'Multi-purpose venue for physical education, assemblies, performances, and school events.',
      image: coveredcourtImg,
      spanClass: 'lg:col-span-4',
    },
    {
      title: 'Library',
      description: 'Quiet learning area for reading, research, independent study, and reference work.',
      image: schoolmapImg,
      spanClass: 'lg:col-span-8',
    },
  ];

  // Hardcoded fallback playlist rendered when database has no videos yet
  const fallbackVideos = [
    {
      id: 1,
      title: 'Sample Video Title',
      description: 'Sample description here.',
      created_at: '2026-01-01T00:00:00Z',
      video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    },
    {
      id: 2,
      title: 'Campus Highlights',
      description: 'A quick look at recent school activities and student moments.',
      created_at: '2026-01-08T00:00:00Z',
      video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    },
    {
      id: 3,
      title: 'Official School Update',
      description: 'Featured clips and announcements from the RMNHS community.',
      created_at: '2026-01-15T00:00:00Z',
      video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [annRes, newsRes, videoRes] = await Promise.all([
          supabase.from('announcements').select('*').order('created_at', { ascending: false }),
          supabase.from('news').select('*').order('created_at', { ascending: false }),
          supabase.from('featured_videos').select('*').order('created_at', { ascending: false }),
        ]);
        if (annRes.data) setAnnouncements(annRes.data);
        if (newsRes.data) setNews(newsRes.data);
        
        // Use database videos if available, otherwise fall back to hardcoded playlist
        const videos = videoRes.data && videoRes.data.length > 0 ? videoRes.data : fallbackVideos;
        setFeaturedVideos(videos);
        setSelectedVideo(videos[0] || null);
      } catch (error) {
        console.error('Error fetching data:', error);
        // On error, use fallback so homepage always has content
        setFeaturedVideos(fallbackVideos);
        setSelectedVideo(fallbackVideos[0]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const paginateItems = (items, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  useEffect(() => {
    if (!selectedPost) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedPost(null);
        setSelectedPostType('');
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPost]);

  const openPostModal = (item, type) => {
    setSelectedPost(item);
    setSelectedPostType(type);
  };

  const closePostModal = () => {
    setSelectedPost(null);
    setSelectedPostType('');
  };

  const renderPagination = (totalItems, currentPage, setPage) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages <= 1) return null;

    return Array.from({ length: totalPages }, (_, index) => {
      const pageNumber = index + 1;

      return (
        <button
          key={pageNumber}
          type="button"
          onClick={() => setPage(pageNumber)}
          className={`w-10 h-10 rounded-full text-sm font-bold transition-all duration-300 ${
            currentPage === pageNumber
              ? 'bg-maroon-800 text-white shadow-lg shadow-maroon-900/20'
              : 'bg-white text-gray-500 border border-gray-100 hover:text-maroon-800 hover:border-maroon-200'
          }`}
        >
          {pageNumber}
        </button>
      );
    });
  };

  const AnnouncementCard = ({ item }) => (
    <article className="group overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-maroon-950/10">
      <div className="h-60 overflow-hidden bg-[#fbfbfa]">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-maroon-50 text-maroon-800">
            <Megaphone size={48} />
          </div>
        )}
      </div>
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
          <Calendar size={12} />
          {new Date(item.created_at).toLocaleDateString()}
        </div>
        <h3 className="text-2xl font-bold text-gray-950 tracking-tight leading-tight">{item.title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{item.description}</p>
        <button
          type="button"
          onClick={() => openPostModal(item, 'announcement')}
          className="inline-flex w-fit items-center gap-3 rounded-full border border-gray-200 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-600 transition-all hover:border-maroon-800 hover:text-maroon-800"
        >
          Read more <ArrowRight size={16} />
        </button>
      </div>
    </article>
  );

  const NewsCard = ({ item }) => (
    <article className="group overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-maroon-950/10">
      <div className="h-60 overflow-hidden bg-[#fbfbfa]">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-950 text-white">
            <Newspaper size={48} />
          </div>
        )}
      </div>
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
          <Calendar size={12} />
          {new Date(item.created_at).toLocaleDateString()}
        </div>
        <h3 className="text-2xl font-bold text-gray-950 tracking-tight leading-tight">{item.title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{item.description}</p>
        <button
          type="button"
          onClick={() => openPostModal(item, 'news')}
          className="inline-flex w-fit items-center gap-3 rounded-full border border-gray-200 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-600 transition-all hover:border-maroon-800 hover:text-maroon-800"
        >
          Read more <ArrowRight size={16} />
        </button>
      </div>
    </article>
  );

  const PostModal = () => {
    if (!selectedPost) return null;

    const isAnnouncement = selectedPostType === 'announcement';
    const CategoryIcon = isAnnouncement ? Megaphone : Newspaper;
    const category = isAnnouncement ? 'Announcement' : 'News';

    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-modal-title"
        onClick={closePostModal}
      >
        <article
          className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={closePostModal}
            aria-label="Close details"
            className="sticky top-5 float-right mr-5 mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-gray-700 text-white shadow-lg transition hover:bg-maroon-800"
          >
            <X size={26} />
          </button>

          <div className="px-6 pb-12 pt-8 sm:px-12 lg:px-20">
            <div className="mx-auto flex min-h-[260px] max-w-3xl items-center justify-center">
              {selectedPost.image_url ? (
                <img
                  src={selectedPost.image_url}
                  alt={selectedPost.title}
                  className="max-h-[360px] w-full rounded-md object-contain"
                />
              ) : (
                <div className="flex h-72 w-full items-center justify-center rounded-md bg-maroon-50 text-maroon-800">
                  <CategoryIcon size={72} />
                </div>
              )}
            </div>

            <div className="mx-auto mt-12 max-w-4xl">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-maroon-800">
                {category}
              </p>
              <p className="mt-4 text-base text-gray-400">
                {new Date(selectedPost.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
              <h2 id="post-modal-title" className="mt-8 text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">
                {selectedPost.title}
              </h2>
              <p className="mt-10 text-base text-gray-400">RMNHS Office</p>

              <div className="my-8 border-t border-gray-200"></div>

              <p className="text-xs font-bold uppercase tracking-[0.28em] text-maroon-800">
                {category}
              </p>
              <p className="mt-8 whitespace-pre-line text-base leading-8 text-gray-700">
                {selectedPost.description || 'No details available.'}
              </p>
            </div>
          </div>
        </article>
      </div>
    );
  };

  return (
    <main className="flex w-full flex-col overflow-x-hidden bg-[#f7f7f5] font-outfit text-gray-950">
      <PostModal />
      
      {/* Cinematic Hero Section */}
      <section className="relative h-[85dvh] min-h-[480px] w-full overflow-hidden bg-black sm:h-[90dvh] lg:h-screen">
        {/* Carousel Background */}
        <div className="absolute inset-0 z-0">
          {slides.map((slide, index) => (
            <div 
              key={index} 
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${currentSlide === index ? 'opacity-100' : 'opacity-0'}`}
            >
              <img src={slide} alt={`Slide ${index}`} className="w-full h-full object-cover" />
              {/* Maroon/Dark Tint Overlay */}
              <div className="absolute inset-0 bg-maroon-950/40 backdrop-brightness-75"></div>
            </div>
          ))}
        </div>

        {/* Vignette / Edge Blur Mask (Simulating the leaf/organic frame) */}
        <div className="absolute inset-0 z-10 pointer-events-none">
           <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.8)_100%)]"></div>
           <div className="absolute inset-0 backdrop-blur-[2px] [mask-image:radial-gradient(circle,transparent_50%,black_100%)]"></div>
        </div>

        {/* Content - Text removed to favor background image messaging */}
        <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-10">

           {/* Carousel Indicators */}
           <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-3 z-30">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-500 ${
                    currentSlide === index ? 'bg-white scale-125' : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
           </div>
        </div>
      </section>

      {/* Announcements */}
      <section className="announcements py-24">
        <div className="announcements-container user-screen-container">
          <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-maroon-800">Notice Board</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
                Important advisories for students, parents, and staff.
              </h2>
              <p className="mt-4 text-sm leading-7 text-gray-500 md:text-base">
                Check the latest official reminders, schedules, and campus announcements from the RMNHS community.
              </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-maroon-50 text-maroon-800">
                  <Megaphone size={18} />
                </div>
                <p className="mt-4 text-2xl font-bold tracking-tight text-gray-950">{loading ? '--' : announcements.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Notices posted</p>
              </div>

              <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-950 text-white">
                  <Calendar size={18} />
                </div>
                <p className="mt-4 text-2xl font-bold tracking-tight text-gray-950">Latest</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Sorted updates</p>
              </div>

              <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f4f0eb] text-gray-950">
                  <ArrowRight size={18} />
                </div>
                <p className="mt-4 text-2xl font-bold tracking-tight text-gray-950">Read</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Full notices</p>
              </div>
            </div>
          </div>
          
          <div className="announcements-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="announcementsGrid">
            {loading ? (
              [1, 2, 3].map((item) => (
                <div key={item} className="h-[420px] animate-pulse rounded-[1.5rem] bg-white shadow-sm ring-1 ring-black/5"></div>
              ))
            ) : announcements.length > 0 ? (
              paginateItems(announcements, announcementPage).map((announcement) => (
                <AnnouncementCard key={announcement.id} item={announcement} />
              ))
            ) : (
              <div className="col-span-full rounded-[1.5rem] border border-dashed border-gray-200 bg-white py-20 text-center shadow-sm ring-1 ring-black/5">
                <p className="text-sm font-medium text-gray-400">No announcements available.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="pagination flex justify-center gap-3 mt-12" id="paginationContainer">
            {renderPagination(announcements.length, announcementPage, setAnnouncementPage)}
          </div>
        </div>
      </section>


      {/* Latest News */}
      <section className="latest-news bg-white py-24">
        <div className="latest-news-container user-screen-container">
          <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-maroon-800">Campus Journal</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
                Stories from classrooms, programs, and school events.
              </h2>
              <p className="mt-4 text-sm leading-7 text-gray-500 md:text-base">
                Follow recent highlights and achievements that show learning, service, and collaboration in motion.
              </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-black/5 bg-[#fbfbfa] p-4 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-maroon-50 text-maroon-800">
                  <Newspaper size={18} />
                </div>
                <p className="mt-4 text-2xl font-bold tracking-tight text-gray-950">{loading ? '--' : news.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Stories posted</p>
              </div>

              <div className="rounded-2xl border border-black/5 bg-[#fbfbfa] p-4 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-950 text-white">
                  <Award size={18} />
                </div>
                <p className="mt-4 text-2xl font-bold tracking-tight text-gray-950">Campus</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Highlights</p>
              </div>

              <div className="rounded-2xl border border-black/5 bg-[#fbfbfa] p-4 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f4f0eb] text-gray-950">
                  <ArrowRight size={18} />
                </div>
                <p className="mt-4 text-2xl font-bold tracking-tight text-gray-950">Open</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Story cards</p>
              </div>
            </div>
          </div>
          <div className="news-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="newsGrid">
            {loading ? (
              [1, 2, 3].map((item) => (
                <div key={item} className="h-[420px] animate-pulse rounded-[1.5rem] bg-gray-100"></div>
              ))
            ) : news.length > 0 ? (
              paginateItems(news, newsPage).map((newsItem) => (
                <NewsCard key={newsItem.id} item={newsItem} />
              ))
            ) : (
              <div className="col-span-full rounded-[1.5rem] border border-dashed border-gray-200 bg-[#fbfbfa] py-20 text-center">
                <p className="text-sm font-medium text-gray-400">No latest news available.</p>
              </div>
            )}
          </div>
          <div className="pagination flex justify-center gap-3 mt-12" id="newsPaginationContainer">
            {renderPagination(news.length, newsPage, setNewsPage)}
          </div>
        </div>
      </section>

      {/* Featured Video */}
      <section className="featured-video relative overflow-hidden bg-[radial-gradient(circle_at_88%_16%,rgba(255,255,255,0.10)_0%,transparent_30%),linear-gradient(135deg,#210000_0%,#430505_42%,#120505_72%,#030303_100%)] py-24 text-white">
        <HeroWaveBackground />
        <div className="featured-video-container user-screen-container relative z-10">
          <div className="featured-video-heading max-w-3xl mb-16">
            <span className="featured-video-kicker text-[10px] font-bold uppercase tracking-[0.3em] text-maroon-200">
              School Media
            </span>
            <h2 className="featured-video-title text-4xl lg:text-5xl font-bold tracking-tight italic mt-4">
              Featured Videos
            </h2>
            <p className="featured-video-copy text-white/60 leading-relaxed mt-4">
              Watch the latest featured clips, school highlights, and official uploads in one place.
            </p>
          </div>

          <div className="featured-video-grid grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-8 items-start">
            <div className="featured-main">
              <div className="video-wrapper aspect-video overflow-hidden rounded-[1.5rem] bg-black border border-white/10 shadow-2xl">
                {selectedVideo && (
                  <iframe
                    key={selectedVideo.id}
                    id="mainVideo"
                    title={selectedVideo.title}
                    width="100%"
                    src={toEmbedUrl(selectedVideo.video_url || selectedVideo.embedUrl)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                )}
              </div>

              <div className="video-info mt-8 space-y-3">
                <h3 id="mainTitle" className="text-3xl font-bold tracking-tight">
                  {selectedVideo?.title}
                </h3>
                <p id="mainDesc" className="text-white/60 leading-relaxed">
                  {selectedVideo?.description}
                </p>
                <p id="mainDate" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                  <Calendar size={12} />
                  {selectedVideo?.created_at
                    ? new Date(selectedVideo.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                    : selectedVideo?.date}
                </p>
              </div>
            </div>

            <div className="video-list-panel rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
              <div className="video-list-panel-header flex items-end justify-between gap-4 mb-6">
                <h3 className="text-2xl font-bold tracking-tight">Playlist</h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Tap a card to switch videos
                </span>
              </div>
              <div className="video-list space-y-4" id="videoList">
                {featuredVideos.map((video) => (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => setSelectedVideo(video)}
                    className={`w-full text-left rounded-2xl border p-4 transition-all duration-300 ${
                      selectedVideo?.id === video.id
                        ? 'border-maroon-300 bg-maroon-800/40'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.07]'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="w-14 h-14 shrink-0 rounded-xl bg-white/10 flex items-center justify-center text-maroon-100">
                        <Play size={20} fill="currentColor" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold leading-tight">{video.title}</h4>
                        <p className="mt-2 text-xs text-white/50 line-clamp-2">{video.description}</p>
                        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/30">
                          {video.created_at
                            ? new Date(video.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : video.date}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Facilities Bento Grid */}
      <section className="bg-white py-24">
         <div className="user-screen-container">
            <div className="mb-8 flex flex-col justify-between gap-4 rounded-[1.5rem] bg-[#fbfbfa] p-5 shadow-sm ring-1 ring-black/5 md:flex-row md:items-center">
               <div>
                 <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-maroon-800">Campus Facilities</p>
                 <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 md:text-3xl">Our Campus Facilities</h2>
               </div>
               <p className="max-w-xl text-sm leading-6 text-gray-500">Providing a conducive learning environment equipped with laboratories and recreation areas.</p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
               <div className="group relative min-h-[280px] overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-black/5 md:col-span-8 md:min-h-[360px] lg:min-h-[420px]">
                  <img src={speechlabImg} alt="Speech Lab" className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6 text-white sm:bottom-10 sm:left-10 sm:right-10">
                     <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">01</span>
                     <h3 className="mt-2 text-2xl font-bold italic sm:text-3xl lg:text-4xl">Speech Laboratory</h3>
                     <p className="mt-2 max-w-sm text-sm text-white/70 sm:text-base">Enhancing linguistic skills with advanced audio-visual equipment.</p>
                  </div>
               </div>

               <div className="group relative min-h-[220px] overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-black/5 md:col-span-4 md:min-h-[280px]">
                  <img src={comlabImg} alt="Computer Lab" className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6 text-white sm:bottom-10 sm:left-10">
                     <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">02</span>
                     <h3 className="mt-2 text-xl font-bold italic sm:text-2xl lg:text-3xl">Music Room</h3>
                  </div>
               </div>

               <div className="group relative min-h-[220px] overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-black/5 md:col-span-5 md:min-h-[280px]">
                  <img src={coveredcourtImg} alt="Court" className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6 text-white sm:bottom-10 sm:left-10">
                     <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">03</span>
                     <h3 className="mt-2 text-xl font-bold italic sm:text-2xl lg:text-3xl">Library</h3>
                  </div>
               </div>

               <div className="relative min-h-[260px] overflow-hidden rounded-[1.5rem] border border-maroon-100 bg-maroon-950 p-7 text-white shadow-sm md:col-span-7 md:min-h-[320px] sm:p-10">
                  <div className="absolute inset-x-0 top-0 h-1 bg-maroon-600"></div>
                  <div className="flex h-full flex-col justify-between gap-10">
                     <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-maroon-200">Facilities Directory</p>
                        <h3 className="mt-4 max-w-2xl text-3xl font-bold italic tracking-tight sm:text-4xl lg:text-5xl">
                          Explore campus learning spaces.
                        </h3>
                        <p className="mt-5 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
                          View the complete list of school facilities used for instruction, research, reading, performance, and student activities.
                        </p>
                     </div>

                     <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {facilities.map((facility) => (
                          <div key={facility.title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Space</span>
                            <span className="mt-1 block text-sm font-bold leading-tight text-white">{facility.title}</span>
                          </div>
                        ))}
                     </div>

                     <button
                       type="button"
                       onClick={() => setShowAllFacilities((current) => !current)}
                       className="inline-flex w-fit min-h-11 items-center gap-3 rounded-full bg-white px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-maroon-900 transition-all hover:bg-maroon-50"
                     >
                       {showAllFacilities ? 'Show Less' : 'Explore More'}
                       <ArrowRight size={18} className={`transition-transform ${showAllFacilities ? '-rotate-90' : ''}`} />
                     </button>
                  </div>
               </div>
            </div>

            {showAllFacilities && (
              <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-12">
                {facilities.map((facility, index) => (
                  <article
                    key={facility.title}
                    className={`group relative min-h-[340px] overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-maroon-950/10 ${facility.spanClass}`}
                  >
                    <img
                      src={facility.image}
                      alt={facility.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent"></div>
                    <div className="absolute bottom-7 left-7 right-7 text-white sm:bottom-9 sm:left-9 sm:right-9">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h3 className="mt-3 text-3xl font-bold italic tracking-tight sm:text-4xl">{facility.title}</h3>
                      <p className="mt-3 max-w-xl text-sm font-medium leading-7 text-white/80 sm:text-base">
                        {facility.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
         </div>
      </section>

      {/* Quote Section */}
      <section className="relative overflow-hidden py-28">
         <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[40rem] font-bold italic select-none">"</div>
         </div>
         <div className="relative z-10 mx-auto max-w-4xl px-6 text-center lg:px-10 space-y-12">
            <GraduationCap size={64} className="mx-auto text-maroon-800 opacity-20" />
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-950 leading-tight tracking-tight">
               "Education is the most powerful weapon which you can use to change the world."
            </h2>
            <div className="space-y-2">
               <p className="text-lg font-bold text-maroon-800">Nelson Mandela</p>
               <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Inspiration for RMNHS</p>
            </div>
         </div>
      </section>

    </main>
  );
};

export default Home;


