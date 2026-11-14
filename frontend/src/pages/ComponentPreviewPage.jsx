import { useState } from "react";
import { Search } from "lucide-react";

import Button from "../components/common/Button";
import Input from "../components/common/Input";
import SearchBar from "../components/common/SearchBar";
import StatusBadge from "../components/common/StatusBadge";
import ConfirmDialog from "../components/common/ConfirmDialog";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";

function ComponentPreviewPage() {
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleConfirm = () => {
    setShowDialog(false);
    setMessage("Confirmation button works!");
  };

  return (
    <div className="component-preview-page">
      <header className="component-preview-header">
        <h1>SmartShelf UI Components</h1>
        <p>Testing our reusable common components</p>
      </header>

      {/* Buttons */}
      <section className="component-preview-card">
        <h2>1. Buttons</h2>
        <div className="component-preview-row">
          <Button onClick={() => setMessage("Primary button works!")}>
            Primary Button
          </Button>

          <Button variant="secondary">Secondary Button</Button>

          <Button variant="danger">Danger Button</Button>
        </div>
      </section>

      {/* Input */}
      <section className="component-preview-card">
        <h2>2. Input Field</h2>
        <Input
          label="Your Name"
          name="previewName"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {name && <p>Hello, {name}!</p>}
      </section>

      {/* Search Bar */}
      <section className="component-preview-card">
        <h2>3. Search Bar</h2>
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for books..."
        />
        {search && <p>Searching for: {search}</p>}
      </section>

      {/* Status Badges */}
      <section className="component-preview-card">
        <h2>4. Status Badges</h2>
        <div className="component-preview-row">
          <StatusBadge status="Available" />
          <StatusBadge status="Pending" />
          <StatusBadge status="Borrowed" />
          <StatusBadge status="Overdue" />
        </div>
      </section>

      {/* Confirmation Dialog */}
      <section className="component-preview-card">
        <h2>5. Confirmation Dialog</h2>
        <Button onClick={() => setShowDialog(true)}>Open Confirmation</Button>
      </section>

      {/* Loading Spinner */}
      <section className="component-preview-card">
        <h2>6. Loading Spinner</h2>
        <Button
          variant="secondary"
          onClick={() => setShowLoading(!showLoading)}
        >
          {showLoading ? "Hide Loading" : "Show Loading"}
        </Button>

        {showLoading && <LoadingSpinner message="Loading books..." />}
      </section>

      {/* Empty State */}
      <section className="component-preview-card">
        <h2>7. Empty State</h2>
        <EmptyState
          icon={Search}
          title="No books found"
          message="Try searching with a different title or author."
        />
      </section>

      {message && <p className="component-preview-message">{message}</p>}

      <ConfirmDialog
        isOpen={showDialog}
        title="Confirm action"
        message="Do you want to continue with this action?"
        confirmText="Yes, continue"
        onConfirm={handleConfirm}
        onCancel={() => setShowDialog(false)}
        variant="primary"
      />
    </div>
  );
}

export default ComponentPreviewPage;
