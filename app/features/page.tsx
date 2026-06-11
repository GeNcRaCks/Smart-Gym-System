export default function FeaturesPage() {
    return (
        <div className="container py-24">
            <h1 className="heading-section text-center mb-12">Features</h1>
            <div className="grid md:grid-cols-3 gap-8">
                <div className="card-premium">
                    <h2 className="heading-card">AI Coaching</h2>
                    <p className="text-body text-sm">Real-time form correction and load adjustment.</p>
                </div>
                <div className="card-premium">
                    <h2 className="heading-card">Nutrition</h2>
                    <p className="text-body text-sm">Macro tracking and meal planning.</p>
                </div>
                <div className="card-premium">
                    <h2 className="heading-card">Community</h2>
                    <p className="text-body text-sm">Join groups and compete in challenges.</p>
                </div>
            </div>
        </div>
    );
}
