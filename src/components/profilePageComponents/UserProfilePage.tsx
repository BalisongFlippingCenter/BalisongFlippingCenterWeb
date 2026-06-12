import UserProfileData from "./UserProfileData";
import UserProfilePostsComponent from "../UserProfilePostsComponent";
import UserProfileBanner from "./UserProfileBanner";
import UserProfileImage from "./UserProfileImage";

const UserProfilePage = () => {
  return (
    <>
      <div className="w-full min-h-screen pb-24">
        {/*Profile Display Info*/}
        <section className="w-full flex flex-col">
          <div className="w-full">
            <UserProfileBanner />
            <UserProfileImage />
          </div>

          <div className="w-full">
            <UserProfileData />
          </div>
        </section>

        {/*Display Profile Posts*/}
        <section>
          <UserProfilePostsComponent />
        </section>
      </div>
    </>
  );
};

export default UserProfilePage;
