import { useAppSelector } from "../redux/hooks";

const ProfileImageDisplay = () => {
  const user = useAppSelector((state) => state.auth.user);

  if (!user?.profileImg || user.profileImg === "") {
    return <div>Error</div>;
  }

  return (
    <img
      src={user.profileImg}
      className="w-full h-full object-cover"
    />
  );
};

export default ProfileImageDisplay;
