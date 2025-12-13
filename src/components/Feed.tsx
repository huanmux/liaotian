// Feed.tsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase, Post, uploadMedia } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Send, Edit3, FileText, X, Paperclip, LayoutGrid, Smartphone, Gift, Search } from 'lucide-react';
import { Shots } from './Shots';
import { StatusTray } from './Status';
import { PostItem, AudioPlayer } from './Post'; // Import PostItem and reused AudioPlayer for composer preview
import { motion, AnimatePresence } from 'framer-motion';
import { SPECIAL_EVENT_MODE } from '../App';

const SVG_PATH = "M403.68 234.366c-3.681 5.618-30.224 30.851-40.724 38.713-25.347 18.983-38.394 24.776-77.79 34.544-23.062 5.718-26.126 6.76-29.666 10.087-7.857 7.384-13.863 11.247-21.384 13.752-9.789 3.259-12.116 5.672-12.116 12.558 0 3.825-.438 5.035-2.25 6.216-2.635 1.716-20.674 9.566-29.076 12.652l-5.825 2.141-2.971-2.116c-9.884-7.038-20.846.73-18.023 12.769 1.281 5.464 4.697 13.648 7.648 18.323 2.003 3.172 3.01 3.922 4.768 3.546 1.226-.263 4.254-.713 6.729-1.001 42.493-4.949 40.864-5.209 23.4 3.732-19.939 10.207-18.133 8.396-15.298 15.335 3.253 7.964 12.604 17.385 20.007 20.156l5.391 2.019.571-3.146c2.04-11.232 8.429-15.14 35.313-21.598l16.883-4.056 13.117 2.49c12.523 2.378 44.627 6.84 45.186 6.281.557-.557-2.339-3.496-10.071-10.22-12.342-10.734-11.967-10.234-8.194-10.934 3.07-.569 13.356.364 24.48 2.221 5.695.951 6.849 1.949 10.602 9.17 8.474 16.302 4.32 33.766-10.663 44.834-12.739 9.412-30.225 15.712-58.895 21.221-41.565 7.986-66.646 14.612-87.823 23.201-38.111 15.456-64.943 39.315-81.349 72.337-25.537 51.399-13.852 115.129 29.49 160.845 11.285 11.904 24.516 22.439 35.558 28.313 9.965 5.301 26.891 11.195 32.681 11.381l4.114.131-3.5.619-3.5.618 4.157 1.262c19.446 5.905 48.822 7.93 69.843 4.814 35.165-5.213 59.534-15.919 91.968-40.404 14.472-10.926 38.359-33.149 60.337-56.135 45.747-47.846 70.153-71.503 80.342-77.878C518.855 595.832 531.512 592 544 592c18.29 0 32.472 6.933 42.959 21 6.102 8.186 10.208 17.124 12.861 28 2.382 9.768 3.878 23.317 2.327 21.069-.752-1.088-1.147-.49-1.65 2.5-1.775 10.54-7.924 25.284-13.676 32.793-8.697 11.352-23.899 22.822-37.247 28.103-13.613 5.385-37.399 10.294-61.035 12.597-27.42 2.671-56.809 7.787-72.039 12.54-28.765 8.977-52.539 27.345-63.932 49.398-14.355 27.783-13.427 60.661 2.466 87.415 5.626 9.47 8.339 12.945 16.466 21.088 6.022 6.035 7.163 6.986 17.716 14.777 18.026 13.307 43.527 22.826 73.017 27.255 13.391 2.011 52.549 2.016 54.558.007.202-.202-2.256-.881-5.462-1.508-14.198-2.779-32.245-10.073-41.829-16.905-15.141-10.793-30.463-25.813-37.688-36.946-2.029-3.126-5.016-7.483-6.638-9.683C416.705 874.014 413 864.636 413 854.684c0-5.65 2.569-16.422 4.312-18.082 9.77-9.301 25.027-16.03 48.822-21.533 64.081-14.82 109.776-51.401 128.122-102.569 3.224-8.992 6.818-27.367 7.726-39.5l.71-9.5.154 9.583c.144 8.953-.301 12.954-2.993 26.917-1.404 7.286-7.125 23.019-11.09 30.5-1.749 3.3-3.649 7.009-4.222 8.242-.572 1.233-1.378 2.246-1.791 2.25s-.75.646-.75 1.425-.357 1.566-.793 1.75-1.887 2.133-3.226 4.333c-2.159 3.55-12.538 16.048-17.218 20.734-3.451 3.456-18.579 15.488-22.376 17.797-2.138 1.3-4.112 2.667-4.387 3.039-.275.371-5.9 3.4-12.5 6.731-16.549 8.351-30.523 13.68-47.732 18.205-2.602.684-4.477 1.656-4.166 2.16.312.503 1.316.689 2.232.412s8.641-1.213 17.166-2.081c40.585-4.13 69.071-9.765 92.5-18.298 15.33-5.583 37.661-18.554 50.945-29.591 10.296-8.554 25.124-24.582 33.34-36.037 3.374-4.704 13.526-23.941 16.397-31.071 2.83-7.028 5.649-16.706 8.011-27.5 1.966-8.988 2.293-13.308 2.27-30-.029-21.817-1.459-32.183-6.545-47.461-4.267-12.818-13.982-32.084-21.064-41.771-7.41-10.137-23.927-26.589-33.354-33.222-15.179-10.682-37.054-20.061-56.5-24.226-13.245-2.836-42.849-2.586-57.5.487-27.999 5.872-54.161 18.066-78.5 36.589-8.789 6.689-30.596 26.259-34.981 31.392-5.122 5.997-38.941 40.833-55.176 56.835-15.863 15.637-22.787 22.017-31.337 28.877-2.742 2.2-5.89 4.829-6.996 5.843-1.105 1.013-6.06 4.488-11.01 7.722s-9.45 6.242-10 6.686c-2.014 1.624-12.507 6.373-19.656 8.896-8.791 3.103-26.867 4.32-35.998 2.425-14.396-2.989-26.608-12.051-32.574-24.172-3.938-8-5.216-13.468-5.248-22.44-.05-14.406 4.83-25.419 16.415-37.046 8.018-8.047 15.344-13.02 27.453-18.636 13.664-6.337 24.699-9.76 68.608-21.281 23.61-6.195 53.403-16.746 65-23.02 37.251-20.151 62.371-49.521 70.969-82.977 3.164-12.312 4.368-32.296 2.62-43.5-2.675-17.153-11.273-37.276-22.004-51.5-10.94-14.501-29.977-30.241-43.244-35.755l-4.987-2.072 5.325-2.166c15.935-6.483 33.215-19.607 42.642-32.385 5.925-8.032 12.007-19.627 10.884-20.751-.359-.358-2.374.874-4.48 2.739-19.929 17.652-32.524 25.61-53.225 33.626-8.739 3.383-30.986 9.264-35.049 9.264-.617 0 2.629-2.521 7.214-5.602 21.853-14.688 39.424-33.648 49.197-53.085 2.254-4.483 7.638-17.828 7.638-18.932 0-1.228-1.997-.034-3.32 1.985m-9.601 249.217c.048 1.165.285 1.402.604.605.289-.722.253-1.585-.079-1.917s-.568.258-.525 1.312m-6.62 20.484c-.363.586-.445 1.281-.183 1.543s.743-.218 1.069-1.067c.676-1.762.1-2.072-.886-.476m207.291 56.656c1.788.222 4.712.222 6.5 0 1.788-.221.325-.403-3.25-.403s-5.038.182-3.25.403m13.333-.362c.23.199 3.117.626 6.417.949 3.811.374 5.27.268 4-.29-1.892-.832-11.303-1.427-10.417-.659M627 564.137c3.575 1.072 7.4 2.351 8.5 2.842 1.1.49 4.025 1.764 6.5 2.83 6.457 2.78 15.574 9.246 22.445 15.918 5.858 5.687 5.899 4.716.055-1.277-3.395-3.481-13.251-11.028-18.5-14.164-4.511-2.696-20.509-8.314-23.33-8.192-1.193.051.755.97 4.33 2.043M283.572 749.028c-2.161 1.635-3.511 2.96-3 2.945.945-.027 8.341-5.92 7.428-5.918-.275 0-2.268 1.338-4.428 2.973M264.5 760.049c-14.725 7.213-25.192 9.921-42 10.865-12.896.724-13.276.798-4.822.936 16.858.275 31.491-2.958 46.822-10.347 6.099-2.939 11.984-6.524 10.5-6.396-.275.023-5 2.247-10.5 4.942M435 897.859c0 1.77 20.812 21.955 28.752 27.887 10.355 7.736 27.863 16.301 40.248 19.691 11.885 3.254 27.788 4.339 38.679 2.641 15.915-2.483 42.821-11.687 56.321-19.268 4.671-2.624 21.633-13.314 22.917-14.443.229-.202.185-.599-.098-.882s-2.496.561-4.917 1.876c-8.642 4.692-29.216 11.343-44.402 14.354-7.013 1.391-13.746 1.775-30.5 1.738-19.299-.042-22.831-.32-34.5-2.724-25.415-5.234-48.507-14.972-66.207-27.92-5.432-3.973-6.293-4.377-6.293-2.95";
const SVG_VIEWBOX = "0 0 784 1168";

const FOLLOW_ONLY_FEED = import.meta.env.VITE_FOLLOW_ONLY_FEED === 'true';
const POST_PAGE_SIZE = 10;

// --- FRAMER MOTION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      stiffness: 70, 
      damping: 10,
      delayChildren: 0.1,
      staggerChildren: 0.05 
    }
  }
};

const postItemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 12 } }
};

const composerVariants = {
  collapsed: { height: 'auto', opacity: 1 },
  expanded: { height: 'auto', opacity: 1 }
};

export const Feed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'shots'>('posts');

  // --- GIF STATES ---
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifQuery, setGifQuery] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);

  const searchGifs = async (query: string = '') => {
    const apiKey = import.meta.env.VITE_TENOR_API_KEY;
    if (!apiKey) return;
    const searchUrl = query 
      ? `https://tenor.googleapis.com/v2/search?q=${query}&key=${apiKey}&client_key=gazebo_app&limit=12&media_filter=minimal`
      : `https://tenor.googleapis.com/v2/featured?key=${apiKey}&client_key=gazebo_app&limit=12&media_filter=minimal`;
    
    try {
        const res = await fetch(searchUrl);
        const data = await res.json();
        setGifs(data.results || []);
    } catch (e) {
        console.error("Tenor Error", e);
    }
  };

  useEffect(() => {
    if (showGifPicker) searchGifs(gifQuery);
  }, [showGifPicker, gifQuery]);

  const canvasRef = useRef<HTMLCanvasElement>(null); // Ref for WebGL

  // --- SPECIAL EVENT WEBGL LOGIC ---
  useEffect(() => {
    if (!SPECIAL_EVENT_MODE || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl');
    if (!gl) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // ... [Insert the shader sources provided in prompt] ...
    const vertexSource = `attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }`;
    const fragmentSource = `
      precision highp float;
      #define AA
      uniform float width;
      uniform float height;
      vec2 resolution = vec2(width, height);
      uniform float time;
      void main(){
        float strength = 0.4;
        float t = time/6.0;
        vec3 col = vec3(0);
        vec2 fC = gl_FragCoord.xy;
        #ifdef AA
        for(int i = -1; i <= 1; i++) {
          for(int j = -1; j <= 1; j++) {
            fC = gl_FragCoord.xy+vec2(i,j)/3.0;
        #endif
            vec2 pos = fC/resolution.xy;
            pos.y /= resolution.x/resolution.y;
            pos = 4.0*(vec2(0.5) - pos);
            for(float k = 1.0; k < 7.0; k+=1.0){ 
              pos.x += strength * sin(2.0*t+k*1.5 * pos.y)+t*0.5;
              pos.y += strength * cos(2.0*t+k*1.5 * pos.x);
            }
            col += 0.5 + 0.5*cos(time+pos.xyx+vec3(0,2,4));
        #ifdef AA
          }
        }
        col /= 9.0;
        #endif
        col = pow(col, vec3(0.4545));
        gl_FragColor = vec4(col,1.0);
      }
    `;

    // Compile Shaders
    const compileShader = (src: string, type: number) => {
      const shader = gl.createShader(type);
      if(!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      return shader;
    };

    const vert = compileShader(vertexSource, gl.VERTEX_SHADER);
    const frag = compileShader(fragmentSource, gl.FRAGMENT_SHADER);
    if(!vert || !frag) return;

    const program = gl.createProgram();
    if(!program) return;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Buffer Data
    const vertexData = new Float32Array([-1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, -1.0]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

    // Attributes & Uniforms
    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const timeHandle = gl.getUniformLocation(program, 'time');
    const widthHandle = gl.getUniformLocation(program, 'width');
    const heightHandle = gl.getUniformLocation(program, 'height');

    gl.uniform1f(widthHandle, window.innerWidth);
    gl.uniform1f(heightHandle, window.innerHeight);

    // Animation Loop
    let frameId: number;
    let time = 0.0;
    let lastFrame = Date.now();

    const draw = () => {
      const thisFrame = Date.now();
      time += (thisFrame - lastFrame) / 770;
      lastFrame = thisFrame;
      gl.uniform1f(timeHandle, time);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      frameId = requestAnimationFrame(draw);
    };
    
    draw();

    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(widthHandle, window.innerWidth);
      gl.uniform1f(heightHandle, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frameId);
    };
  }, []);

  // Social state (Likes/Comments) - moved details to PostItem, but we keep the list of liked IDs here for context
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());

  // Pagination
  const [postPage, setPostPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);

  const getPostCounts = useCallback(async (postIds: string[]) => {
    if (!postIds.length) return { likeCounts: {}, commentCounts: {} };
    const likeCounts: Record<string, number> = {};
    const commentCounts: Record<string, number> = {};
    for (const postId of postIds) {
      const [{ count: likeCount }, { count: commentCount }] = await Promise.all([
        supabase.from('likes').select('*', { count: 'exact', head: true }).eq('entity_type', 'post').eq('entity_id', postId),
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', postId)
      ]);
      likeCounts[postId] = likeCount || 0;
      commentCounts[postId] = commentCount || 0;
    }
    return { likeCounts, commentCounts };
  }, []);

  const fetchUserLikes = useCallback(async (currentPosts: Post[]) => {
    if (!user || currentPosts.length === 0) return;
    const postIds = currentPosts.map(p => p.id);
    const { data } = await supabase.from('likes').select('entity_id').eq('user_id', user.id).eq('entity_type', 'post').in('entity_id', postIds);
    if (data) setLikedPostIds(prevSet => new Set([...prevSet, ...data.map(d => d.entity_id)]));
  }, [user]);

  const loadPosts = useCallback(async () => {
    if (!user?.id) return;
    
    setPosts([]);
    setPostPage(0);
    setHasMorePosts(true);
    let query = supabase.from('posts').select('*, profiles(*), original_post:repost_of(*, profiles(*))').order('created_at', { ascending: false });
    if (FOLLOW_ONLY_FEED && user) {
      const { data: following } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
      const followingIds = following?.map(f => f.following_id) || [];
      query = query.in('user_id', [...followingIds, user.id]);
    }
    const { data } = await query.range(0, POST_PAGE_SIZE - 1);
    const loadedPosts = data || [];
    const postIds = loadedPosts.map(p => p.id);
    const { likeCounts, commentCounts } = await getPostCounts(postIds);
    const postsWithCounts = loadedPosts.map(post => ({ ...post, like_count: likeCounts[post.id] || 0, comment_count: commentCounts[post.id] || 0 }));
    setPosts(postsWithCounts);
    if (postsWithCounts.length < POST_PAGE_SIZE) setHasMorePosts(false);
    fetchUserLikes(postsWithCounts);
  }, [user?.id, fetchUserLikes, getPostCounts]);
  
  const loadMorePosts = useCallback(async () => {
    if (isLoadingMorePosts || !hasMorePosts) return;
    setIsLoadingMorePosts(true);
    const nextPage = postPage + 1;
    const from = nextPage * POST_PAGE_SIZE;
    const to = from + POST_PAGE_SIZE - 1;
    let query = supabase.from('posts').select('*, profiles(*), original_post:repost_of(*, profiles(*))').order('created_at', { ascending: false });
    if (FOLLOW_ONLY_FEED && user) {
      const { data: following } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
      const followingIds = following?.map(f => f.following_id) || [];
      query = query.in('user_id', [...followingIds, user.id]);
    }
    const { data } = await query.range(from, to);
    const newPosts = data || [];
    const newPostIds = newPosts.map(p => p.id);
    const { likeCounts, commentCounts } = await getPostCounts(newPostIds);
    const newPostsWithCounts = newPosts.map(post => ({ ...post, like_count: likeCounts[post.id] || 0, comment_count: commentCounts[post.id] || 0 }));
    setPosts(current => [...current, ...newPostsWithCounts]);
    setPostPage(nextPage);
    if (newPosts.length < POST_PAGE_SIZE) setHasMorePosts(false);
    fetchUserLikes(newPostsWithCounts);
    setIsLoadingMorePosts(false);
  }, [isLoadingMorePosts, hasMorePosts, postPage, user, fetchUserLikes, getPostCounts]);

  useEffect(() => {
    if (!user?.id) return;
    
    loadPosts();
    const channel = supabase.channel('feed-updates')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
      // Logic to fetch new post
      const { data } = await supabase.from('posts').select('*, profiles(*), original_post:repost_of(*, profiles(*))').eq('id', payload.new.id).single();
      if (data) {
          // Optional: Check if post belongs to a group I'm in or a user I follow before adding
          setPosts(current => [{ ...data, like_count: 0, comment_count: 0 }, ...current]);
      }
    })
    .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, loadPosts]);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 100;
      if (scrolled && isExpanded) setIsExpanded(false);
      setHasScrolled(scrolled);
      if (activeTab === 'posts' && window.innerHeight + document.documentElement.scrollTop + 200 >= document.documentElement.offsetHeight && hasMorePosts && !isLoadingMorePosts) {
        loadMorePosts();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => { window.removeEventListener('scroll', handleScroll); };
  }, [isExpanded, hasMorePosts, isLoadingMorePosts, loadMorePosts, activeTab]);

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !file && !remoteUrl.trim()) return;
    setIsUploading(true);
    setUploadProgress(0);
    let media_url = null;
    let media_type = null;
    if (file) {
      const result = await uploadMedia(file, 'posts', (percent) => setUploadProgress(percent));
      if (!result) { setIsUploading(false); return; }
      media_url = result.url;
      media_type = result.type;
    } else if (remoteUrl.trim()) {
      media_url = remoteUrl.trim();
      if (remoteUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) media_type = 'image';
      else if (remoteUrl.match(/\.(mp4|webm|mov|avi)$/i)) media_type = 'video';
      else if (remoteUrl.match(/\.(mp3|wav|ogg|m4a|weba)$/i)) media_type = 'audio';
      else media_type = 'document';
    }
    await supabase.from('posts').insert({ user_id: user!.id, content, media_url, media_type });
    setContent(''); setFile(null); setRemoteUrl(''); setIsExpanded(false); setIsUploading(false); setUploadProgress(0);
  };

  const goToProfile = async (profileId: string) => {
    const { data } = await supabase.from('profiles').select('username').eq('id', profileId).single();
    if (data) {
      window.history.replaceState({}, '', `/?user=${data.username}`);
      window.dispatchEvent(new CustomEvent('navigateToProfile', { detail: profileId }));
    }
  };

  const getPreview = () => {
    if (file) {
      const url = URL.createObjectURL(file);
      if (file.type.startsWith('image/')) return <img src={url} className="max-h-48 rounded-lg object-cover" alt="Preview" />;
      if (file.type.startsWith('video/')) return <video src={url} className="max-h-48 rounded-lg" controls />;
      if (file.type.startsWith('audio/')) return <AudioPlayer src={url} />;
      return <div className="flex items-center gap-2 p-3 bg-[rgb(var(--color-surface-hover))] rounded-lg"><FileText size={20} className="text-[rgb(var(--color-text-secondary))]" /><span className="text-sm text-[rgb(var(--color-text))]">{file.name}</span></div>;
    }
    if (remoteUrl) {
      if (remoteUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) return <img src={remoteUrl} className="max-h-48 rounded-lg object-cover" alt="Remote preview" />;
      if (remoteUrl.match(/\.(mp4|webm|mov|avi)$/i)) return <video src={remoteUrl} className="max-h-48 rounded-lg" controls />;
      if (remoteUrl.match(/\.(mp3|wav|ogg|m4a|weba)$/i)) return <AudioPlayer src={remoteUrl} />;
      return <div className="flex items-center gap-2 p-3 bg-[rgb(var(--color-surface-hover))] rounded-lg"><Paperclip size={20} className="text-[rgb(var(--color-text-secondary))]" /><span className="text-sm truncate max-w-[200px] text-[rgb(var(--color-text))]">{remoteUrl}</span></div>;
    }
    return null;
  };

  // --- CALLBACKS FOR POSTITEM TO UPDATE PARENT STATE ---
  const handleLikeToggle = (post: Post) => {
    const wasLiked = likedPostIds.has(post.id);
    const newSet = new Set(likedPostIds);
    if (wasLiked) newSet.delete(post.id); else newSet.add(post.id);
    setLikedPostIds(newSet);
    setPosts(current => current.map(p => p.id === post.id ? { ...p, like_count: Math.max(0, p.like_count + (wasLiked ? -1 : 1)) } : p));
  };

  const handleCommentUpdate = (post: Post) => {
     setPosts(current => current.map(p => p.id === post.id ? post : p));
  };

  return (
    <motion.div 
      className="max-w-2xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    > {/* <-- motion.div wrapper */}
      {/* SPECIAL EVENT CANVAS */}
      {SPECIAL_EVENT_MODE && (
        <canvas 
          ref={canvasRef} 
          className="fixed inset-0 z-[-1] opacity-30 pointer-events-none" 
        />
      )}
      
      {activeTab === 'posts' && <StatusTray />}
      {activeTab === 'posts' && (
      <motion.div 
        ref={scrollRef} 
        className="bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))] shadow-sm"
        variants={composerVariants}
        initial={isExpanded ? 'expanded' : 'collapsed'}
        animate={isExpanded ? 'expanded' : 'collapsed'}
        transition={{ duration: 0.3 }}
      > {/* <-- motion.div for composer */}
        <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.form 
            key="expanded" 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }} 
            transition={{ duration: 0.2 }}
            onSubmit={createPost} 
            className="p-4 space-y-3"
          >
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="What's happening?" rows={3} className="w-full px-4 py-3 border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] rounded-2xl focus:outline-none focus:border-[rgb(var(--color-accent))] resize-none text-[rgb(var(--color-text))]" autoFocus />
            {(file || remoteUrl) && (
              <div className="flex items-center justify-between p-3 bg-[rgb(var(--color-surface-hover))] rounded-lg">
                <div className="flex-1">{getPreview()}</div>
                <button type="button" onClick={() => { setFile(null); setRemoteUrl(''); }} className="ml-2 p-1 hover:bg-[rgb(var(--color-border))] rounded-full transition"><X size={18} className="text-[rgb(var(--color-text-secondary))]" /></button>
              </div>
            )}
            {isUploading && <div className="w-full bg-[rgb(var(--color-border))] rounded-full h-2 overflow-hidden"><div className="bg-[rgba(var(--color-accent),1)] h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} /></div>}
            {/* GIF PICKER UI */}
            {showGifPicker && (
              <div className="relative border border-[rgb(var(--color-border))] rounded-xl overflow-hidden bg-[rgb(var(--color-background))] h-64 flex flex-col mb-3">
                 <div className="p-2 border-b border-[rgb(var(--color-border))] flex gap-2">
                    <Search size={16} className="text-[rgb(var(--color-text-secondary))]" />
                    <input 
                      type="text" 
                      placeholder="Search GIFs..." 
                      className="flex-1 bg-transparent text-sm outline-none text-[rgb(var(--color-text))]"
                      value={gifQuery}
                      onChange={(e) => setGifQuery(e.target.value)}
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowGifPicker(false)}><X size={16} className="text-[rgb(var(--color-text-secondary))]" /></button>
                 </div>
                 <div className="flex-1 overflow-y-auto p-2 grid grid-cols-3 gap-2">
                    {gifs.map(gif => (
                       <img 
                          key={gif.id}
                          src={gif.media_formats.tinygif.url}
                          alt="GIF"
                          className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80"
                          onClick={() => {
                             setRemoteUrl(gif.media_formats.gif.url);
                             setFile(null);
                             setShowGifPicker(false);
                          }}
                       />
                    ))}
                 </div>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt" onChange={(e) => { setFile(e.target.files?.[0] || null); setRemoteUrl(''); }} className="hidden" />
            <div className="flex gap-2 items-center flex-wrap">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-[rgb(var(--color-surface-hover))] rounded-full text-sm hover:bg-[rgb(var(--color-border))] transition flex items-center gap-2 text-[rgb(var(--color-text))]"><Paperclip size={16} className="text-[rgb(var(--color-text-secondary))]" /> {file ? 'Change File' : 'Attach'}</button>
              <button type="button" onClick={() => setShowGifPicker(!showGifPicker)} className="px-4 py-2 bg-[rgb(var(--color-surface-hover))] rounded-full text-sm hover:bg-[rgb(var(--color-border))] transition flex items-center gap-2 text-[rgb(var(--color-text))]">
                 <Gift size={16} className="text-pink-500" /> GIF
              </button>

              <div className="flex items-center gap-1"><span className="text-xs text-[rgb(var(--color-text-secondary))]">or</span><input type="url" value={remoteUrl} onChange={(e) => { setRemoteUrl(e.target.value); setFile(null); }} placeholder="Paste URL..." className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] rounded-full focus:outline-none focus:border-[rgb(var(--color-accent))] text-[rgb(var(--color-text))]" /></div>
              <button type="submit" disabled={isUploading || (!content.trim() && !file && !remoteUrl.trim())} className="ml-auto bg-[rgba(var(--color-accent),1)] disabled:bg-[rgb(var(--color-border))] text-[rgb(var(--color-text-on-primary))] px-6 py-2 rounded-full hover:bg-[rgba(var(--color-primary),1)] flex items-center gap-2 font-semibold transition"><Send size={16} /> {isUploading ? 'Uploading...' : 'Post'}</button>
            </div>
          </motion.form>
        ) : (
          <motion.button 
            key="collapsed"
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }} 
            transition={{ duration: 0.2 }}
            onClick={() => setIsExpanded(true)} 
            className="w-full p-4 flex items-center gap-3 hover:bg-[rgb(var(--color-surface-hover))] transition"
          > {/* <-- motion.button for collapsed composer */}
            <Edit3 size={20} className="text-[rgb(var(--color-text-secondary))]" /><span className="text-[rgb(var(--color-text-secondary))]">Write a post...</span>
          </motion.button>
        )}
        </AnimatePresence> {/* <-- ADD CLOSING TAG */}
      </motion.div>
      )}
      <motion.div 
        className="flex border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] sticky top-[0px] z-30"
        layout
      >
        <button onClick={() => setActiveTab('posts')} className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold transition border-b-2 ${activeTab === 'posts' ? 'border-[rgb(var(--color-accent))] text-[rgb(var(--color-accent))]' : 'border-transparent text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-hover))]'}`}><LayoutGrid size={18} /> Posts</button>
        <button onClick={() => setActiveTab('shots')} className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold transition border-b-2 ${activeTab === 'shots' ? 'border-[rgb(var(--color-accent))] text-[rgb(var(--color-accent))]' : 'border-transparent text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-hover))]'}`}><Smartphone size={18} /> Shots</button>
      </motion.div>
      <div>
        {activeTab === 'shots' ? <Shots /> : (
        <motion.div 
           initial="hidden" 
           animate="visible"
           variants={containerVariants}
        > {/* <-- motion.div wrapper for feed content */}
        {posts.length === 0 && !isLoadingMorePosts && <div className="text-center py-12 text-[rgb(var(--color-text-secondary))]">{FOLLOW_ONLY_FEED ? 'No posts from people you follow yet.' : 'No posts yet. Be the first!'}</div>}
        <AnimatePresence initial={false}>
          {posts.map((post) => (
            <motion.div 
              key={post.id} 
              variants={postItemVariants} 
              initial="hidden" 
              animate="visible"
              exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
              layout 
            > {/* <-- motion.div wrapper for each PostItem */}
              <PostItem
                key={post.id}
                post={post}
                currentUserId={user?.id}
                isLiked={likedPostIds.has(post.id)}
                onLikeToggle={handleLikeToggle}
                onCommentUpdate={handleCommentUpdate}
                onNavigateToProfile={goToProfile}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoadingMorePosts && (
          <div className="flex justify-center p-4">
            <div className="logo-loading-container w-6 h-6 relative"><svg xmlns="http://www.w3.org/2000/svg" viewBox={SVG_VIEWBOX} className="logo-svg"><path d={SVG_PATH} fill="none" stroke="rgb(var(--color-primary))" strokeWidth="10" strokeOpacity="0.1" /><path d={SVG_PATH} fill="rgb(var(--color-primary))" className="logo-fill-animated" /></svg></div>
          </div>
        )}
        {!isLoadingMorePosts && !hasMorePosts && posts.length > 0 && <div className="text-center py-8 text-sm text-[rgb(var(--color-text-secondary))]">You've reached the end of the feed.</div>}
        </motion.div>
        )}
      </div>
    </motion.div>
  );
};
