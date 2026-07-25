import React, { useState, useEffect } from 'react';
import './Social.css';
import { API_URL } from '../config';

const MAX_LENGTH = 256;

function formatTimestamp(unixSeconds) {
  return new Date(unixSeconds * 1000).toLocaleString();
}

function Social({ token, onBack }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentSubmitting, setCommentSubmitting] = useState({});

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/social/posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setPosts(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setLoading(false);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    const content = postText.trim();
    if (!content || content.length > MAX_LENGTH) return;

    setError('');
    setPosting(true);
    try {
      const response = await fetch(`${API_URL}/api/social/posts`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error posting');
        setPosting(false);
        return;
      }

      setPosts(prev => [data, ...prev]);
      setPostText('');
      setPosting(false);
    } catch (err) {
      setError('Network error');
      setPosting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await fetch(`${API_URL}/api/social/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) return;

      setPosts(prev =>
        prev.map(p =>
          p.id === postId ? { ...p, likeCount: data.likeCount, likedByMe: data.likedByMe } : p
        )
      );
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleCommentChange = (postId, value) => {
    setCommentDrafts(prev => ({ ...prev, [postId]: value }));
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const content = (commentDrafts[postId] || '').trim();
    if (!content || content.length > MAX_LENGTH) return;

    setCommentSubmitting(prev => ({ ...prev, [postId]: true }));
    try {
      const response = await fetch(`${API_URL}/api/social/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const data = await response.json();

      if (response.ok) {
        setPosts(prev =>
          prev.map(p =>
            p.id === postId ? { ...p, comments: [...p.comments, data] } : p
          )
        );
        setCommentDrafts(prev => ({ ...prev, [postId]: '' }));
      }
      setCommentSubmitting(prev => ({ ...prev, [postId]: false }));
    } catch (err) {
      setCommentSubmitting(prev => ({ ...prev, [postId]: false }));
    }
  };

  return (
    <div className="social-container">
      <button className="back-btn" onClick={onBack}>← Back</button>

      <div className="social-area">
        <h2>💬 Social</h2>

        <form className="post-box" onSubmit={handlePost}>
          <textarea
            value={postText}
            onChange={(e) => setPostText(e.target.value.slice(0, MAX_LENGTH))}
            placeholder="What's on your mind?"
            maxLength={MAX_LENGTH}
            rows={3}
            disabled={posting}
          />
          <div className="post-box-footer">
            <span className={`char-counter ${postText.length >= MAX_LENGTH ? 'limit' : ''}`}>
              {postText.length}/{MAX_LENGTH}
            </span>
            <button type="submit" disabled={posting || !postText.trim()}>
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading-posts">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="no-posts">No posts yet. Be the first to share something!</div>
        ) : (
          <div className="timeline">
            {posts.map(post => (
              <div className="post-card" key={post.id}>
                <div className="post-header">
                  <span className="post-username">{post.username}</span>
                  <span className="post-timestamp">{formatTimestamp(post.createdAt)}</span>
                </div>
                <p className="post-content">{post.content}</p>

                <div className="post-actions">
                  <button
                    className={`like-btn ${post.likedByMe ? 'liked' : ''}`}
                    onClick={() => handleLike(post.id)}
                  >
                    {post.likedByMe ? '❤️' : '🤍'} {post.likeCount}
                  </button>
                </div>

                {post.comments.length > 0 && (
                  <div className="comments-list">
                    {post.comments.map(c => (
                      <div className="comment" key={c.id}>
                        <span className="comment-username">{c.username}:</span>{' '}
                        <span className="comment-content">{c.content}</span>
                      </div>
                    ))}
                  </div>
                )}

                <form className="comment-box" onSubmit={(e) => handleAddComment(e, post.id)}>
                  <input
                    type="text"
                    value={commentDrafts[post.id] || ''}
                    onChange={(e) => handleCommentChange(post.id, e.target.value.slice(0, MAX_LENGTH))}
                    placeholder="Write a comment..."
                    maxLength={MAX_LENGTH}
                    disabled={commentSubmitting[post.id]}
                  />
                  <button
                    type="submit"
                    disabled={commentSubmitting[post.id] || !(commentDrafts[post.id] || '').trim()}
                  >
                    Comment
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Social;
