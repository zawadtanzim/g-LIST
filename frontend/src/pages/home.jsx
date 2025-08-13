
import React from 'react';
import "../css/home.css"


const Home = () => {
	return (
		<>
			<nav>
				<div style={{ display: 'flex', width: '100%' }}>
					<div style={{ marginLeft: 'auto' }} className="nav-links">
						<a href="/signup" className="btn">Sign Up</a>
						<a href="/login" className="btn">Login</a>
					</div>
				</div>
			</nav>

			<div className="home-page">

				{/* Main Hero Section */}
				<section className="hero">
					<h1>🛒 Welcome to Grocery Buddy</h1>
					<p className="hero-subtitle">
						The smarter way to shop together — track, split, and share your grocery lists.
					</p>

					{/* Card-style features like Learn More page */}
					<div className="feature-cards">
						<p>📝 Create and share grocery lists with your family or group</p>
						<p>💰 Track prices & quantities to manage your budget</p>
						<p>📍 Find nearby grocery stores with our map feature</p>
						<p>👥 Join or create family groups for collaborative shopping</p>
					</div>

					{/* Buttons */}
					<div className="cta-buttons">
						  <a href="/signup" className="btn">Get Started</a>
						<a href="/learnmore" className="btn">Learn More</a>
					</div>
				</section>
			</div>
		</>
	);
};

export default Home;
