import { useParams } from "react-router-dom";
import UserProfilePage from "../components/profilePageComponents/UserProfilePage";
import { useAppSelector } from "../redux/hooks";
import ProfilePageDisplay from "../components/profilePageComponents/ProfilePageDisplay";

const ProfilePage = () => {
  const user = useAppSelector((state) => state.auth.user);

  const { account, identifier } = useParams();

  // Show the logged-in user's own profile only when BOTH displayName and identifierCode match.
  // Using || means: if either doesn't match (or user is not logged in), show the public view.
  const isOwnProfile =
    !!user &&
    user.displayName === account &&
    user.identifierCode === identifier;

  if (!isOwnProfile) {
    return (
      <ProfilePageDisplay displayName={account!} identifierCode={identifier!} />
    );
  }

  return <UserProfilePage />;
};

export default ProfilePage;
