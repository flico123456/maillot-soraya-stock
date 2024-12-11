import Image from "next/image";

const UserDisplay = () => {

    const username = localStorage.getItem('username');

    return (
        <div className="flex justify-center p-4">
            <Image src="/user-icon.svg" alt="user" width={20} height={30} />
        <span className="ml-3 font-medium text-black">{username}</span>
      </div>
    );
}

export default UserDisplay;
