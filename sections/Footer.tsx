function Footer() {
  return (
    <div class="py-8 lg:px-0 px-6 fixed bottom-0 w-full mx-auto">
      <a
        href="https://deco.cx/"
        class="flex flex-row gap-2 items-center justify-center text-sm font-medium"
        target="_blank"
      >
        <img
          src="https://assets.decocache.com/decocms/c6af6b61-bb6d-4601-8003-708d62d5fb7a/logo-tiny.svg"
          alt="deco news logo"
          width={24}
          height={24}
        />
        <span class="text-gray-700">deco news</span>
      </a>
    </div>
  );
}

export default Footer;
