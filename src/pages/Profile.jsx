import { useContext, useEffect, useState } from "react";
import { ThemeContext } from "../context/ThemeContext";

export default function Profile({
  fullName,
  email,
  phone,
  address,
  city,
  stateName,
  country,
  zipCode,
  profilePicture,
  saveProfile,
  setPhone,
  setAddress,
  setCity,
  setStateName,
  setCountry,
  setZipCode,
  dateOfBirth,
  setDateOfBirth,
  isMobile,
  backDestination = "dashboard",
  onBack,
}) {
  const { isDark, colors } = useContext(ThemeContext);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(fullName || "");
  const [editPhone, setEditPhone] = useState(phone || "");
  const [editAddress, setEditAddress] = useState(address || "");
  const [editCity, setEditCity] = useState(city || "");
  const [editState, setEditState] = useState(stateName || "");
  const [editCountry, setEditCountry] = useState(country || "");
  const [editZip, setEditZip] = useState(zipCode || "");
  const [editDOB, setEditDOB] = useState(dateOfBirth || "");
  const [profileImage, setProfileImage] = useState(profilePicture || "");

    useEffect(() => {
      if (isEditing) return;
      setEditName(fullName || "");
      setEditPhone(phone || "");
      setEditAddress(address || "");
      setEditCity(city || "");
      setEditState(stateName || "");
      setEditCountry(country || "");
      setEditZip(zipCode || "");
      setEditDOB(dateOfBirth || "");
      setProfileImage(profilePicture || "");
    }, [
      isEditing,
      fullName,
      phone,
      address,
      city,
      stateName,
      country,
      zipCode,
      dateOfBirth,
      profilePicture,
    ]);

  // Calculate age from DOB
  const calculateAge = (dob) => {
    if (!dob) return null;
    const birth = new Date(dob);
    if (isNaN(birth)) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };
  const formatDOB = (dob) => {
    if (!dob) return "Not set";

    const date = new Date(dob);

    if (isNaN(date.getTime())) return "Not set";

    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const age = calculateAge(editDOB);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

 const handleSave = async () => {
  const profile = {
    fullName: editName,
    phone: editPhone,
    address: editAddress,
    city: editCity,
    state: editState,
    country: editCountry,
    zipCode: editZip,
    profilePicture: profileImage,
    dateOfBirth: editDOB,
  };

  const didSave = await saveProfile(profile);
  if (didSave) {
    setIsEditing(false);
  }
};
  const handleCancel = () => {
    setEditName(fullName || "");
    setEditPhone(phone || "");
    setEditAddress(address || "");
    setEditCity(city || "");
    setEditState(stateName || "");
    setEditCountry(country || "");
    setEditZip(zipCode || "");
    setEditDOB(dateOfBirth || "");
    setIsEditing(false);
  };

  if (!isEditing) {
    // View Mode
    return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: colors.text, margin: 0 }}>
            My Profile
          </h1>
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "1px solid #1a3a52",
              background: "#1a3a52",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14,
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.opacity = "0.9";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Edit Profile
          </button>
        </div>

        {/* Profile Picture */}
        <div
          style={{
            background: colors.card,
            borderRadius: 16,
            padding: isMobile ? 20 : 30,
            boxShadow: `0 4px 12px ${isDark ? "rgba(0,0,0,.2)" : "rgba(0,0,0,.05)"}`,
            border: `1px solid ${colors.border}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          {profilePicture ? (
            <img
              src={profilePicture}
              alt={fullName}
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                objectFit: "cover",
                border: `3px solid ${colors.primary}`,
              }}
            />
          ) : (
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: colors.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 50,
                color: "white",
              }}
            >
              {fullName ? fullName.charAt(0).toUpperCase() : "U"}
            </div>
          )}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: colors.text,
              }}
            >
              {fullName || "User"}
            </div>

            <div
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                marginTop: 4,
              }}
            >
              MetroTrust Capital Client
            </div>

            <div
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                marginTop: 6,
                fontWeight: 600,
              }}
            >
              Age: {age ? age : "--"}
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
          

          {/* Phone */}
          <div style={{ background: colors.card, borderRadius: 12, padding: 16, border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              Phone
            </div>
            <div style={{ fontSize: 15, color: colors.text, fontWeight: 600 }}>
              {phone || "Not set"}
            </div>
          </div>

          {/* Date of Birth */}
          <div style={{ background: colors.card, borderRadius: 12, padding: 16, border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <path d="M3 9h18M9 3v6M15 3v6"/>
              </svg>
              Date of Birth
            </div>
            <div style={{ fontSize: 15, color: colors.text, fontWeight: 600 }}>
              {formatDOB(dateOfBirth)}
            </div>
          </div>

          {/* Address */}
          <div style={{ background: colors.card, borderRadius: 12, padding: 16, border: `1px solid ${colors.border}`, gridColumn: isMobile ? "1" : "1 / -1" }}>
            <div style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              Address
            </div>
            <div style={{ fontSize: 15, color: colors.text, fontWeight: 600 }}>
              {address || "Not set"}
            </div>
          </div>

          {/* City */}
          <div style={{ background: colors.card, borderRadius: 12, padding: 16, border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="18" rx="1"/>
                  <path d="M12 3v18M2 9h20M2 15h20M7 3v18M12 3v18M17 3v18"/>
                </svg>
                City
            </div>
            <div style={{ fontSize: 15, color: colors.text, fontWeight: 600 }}>
              {city || "Not set"}
            </div>
          </div>

          {/* State */}
          <div style={{ background: colors.card, borderRadius: 12, padding: 16, border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
                State
            </div>
            <div style={{ fontSize: 15, color: colors.text, fontWeight: 600 }}>
              {stateName || "Not set"}
            </div>
          </div>

          {/* Country */}
          <div style={{ background: colors.card, borderRadius: 12, padding: 16, border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M2 12h20M12 2c0 3-1.5 6-3 8s3 5 3 8m0-16c0 3 1.5 6 3 8s-3 5-3 8"/>
                </svg>
                Country
            </div>
            <div style={{ fontSize: 15, color: colors.text, fontWeight: 600 }}>
              {country || "Not set"}
            </div>
          </div>

          {/* ZIP Code */}
          <div style={{ background: colors.card, borderRadius: 12, padding: 16, border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="17" rx="2"/>
                  <path d="M12 9v6M9 12h6M12 4v2"/>
                </svg>
                ZIP Code
            </div>
            <div style={{ fontSize: 15, color: colors.text, fontWeight: 600 }}>
              {zipCode || "Not set"}
            </div>
          </div>
        </div>

        <button
          onClick={() => onBack ? onBack() : null}
          style={{
            width: "100%",
            padding: "14px 18px",
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            background: "transparent",
            color: colors.text,
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 15,
          }}
        >
          {backDestination === "more" ? "Back" : "Back to Dashboard"}
        </button>
      </div>
    );
  }

  // Edit Mode
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
      <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: colors.text, margin: 0 }}>
        Edit Profile
      </h1>

      <div style={{ background: colors.card, borderRadius: 16, padding: isMobile ? 18 : 24, border: `1px solid ${colors.border}` }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Profile Picture Upload */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 12 }}>
              📷 Profile Picture
            </label>
            <div style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 16,
              borderRadius: 10,
              border: `2px dashed ${colors.primary}`,
              background: colors.bg,
            }}>
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 50,
                    objectFit: "cover"
                  }}
                />
              ) : (
                <div style={{
                  width: 60,
                  height: 60,
                  borderRadius: 50,
                  background: colors.bgTertiary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  color: colors.textSecondary
                }}>
                  {fullName ? fullName.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              <label style={{
                flex: 1,
                cursor: "pointer",
                fontSize: 13,
                color: colors.primary,
                fontWeight: 600
              }}>
                Click to upload image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          </div>

          {/* Full Name (Read-only for now) */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 8 }}>
              Full Name (Display)
            </label>
            <input
              type="text"
              value={editName}
              disabled
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: `1px solid ${colors.border}`,
                background: colors.bg,
                color: colors.textSecondary,
                fontSize: 14,
                boxSizing: "border-box",
                opacity: 0.6,
                cursor: "not-allowed",
              }}
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 8 }}>
              Date of Birth (MM/DD/YYYY)
            </label>
            <input
              type="date"
              value={editDOB}
              onChange={(e) => setEditDOB(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: `1px solid ${colors.border}`,
                background: colors.bg,
                color: colors.text,
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Phone */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 8 }}>
              Phone Number
            </label>
            <input
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="(123) 456-7890"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: `1px solid ${colors.border}`,
                background: colors.bg,
                color: colors.text,
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Address */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 8 }}>
              Street Address
            </label>
            <input
              type="text"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              placeholder="123 Main Street"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: `1px solid ${colors.border}`,
                background: colors.bg,
                color: colors.text,
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* City and State Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 8 }}>
                City
              </label>
              <input
                type="text"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                placeholder="New York"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  background: colors.bg,
                  color: colors.text,
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 8 }}>
                State
              </label>
              <input
                type="text"
                value={editState}
                onChange={(e) => setEditState(e.target.value)}
                placeholder="NY"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  background: colors.bg,
                  color: colors.text,
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Country and ZIP Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 8 }}>
                Country
              </label>
              <input
                type="text"
                value={editCountry}
                onChange={(e) => setEditCountry(e.target.value)}
                placeholder="United States"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  background: colors.bg,
                  color: colors.text,
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 8 }}>
                ZIP Code
              </label>
              <input
                type="text"
                value={editZip}
                onChange={(e) => setEditZip(e.target.value)}
                placeholder="10001"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  background: colors.bg,
                  color: colors.text,
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: "14px 20px",
                borderRadius: 10,
                border: "none",
                background: "#1a3a52",
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 15,
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.opacity = "0.85";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 8px 16px rgba(26, 58, 82, 0.4)`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                  <path d="M5 3h11l3 3v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M8 3v6h8V3" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M8 15h8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <span>Save Changes</span>
              </span>
            </button>
            <button
              onClick={handleCancel}
              style={{
                flex: 1,
                padding: "14px 20px",
                borderRadius: 10,
                border: `1px solid ${colors.border}`,
                background: "transparent",
                color: colors.text,
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 15,
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = colors.bgTertiary;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              ✕ Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
